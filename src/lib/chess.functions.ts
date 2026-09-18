import { createServerFn } from "@tanstack/react-start";
import { Chess } from "chess.js";
import { z } from "zod";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length])
    .join("");
}

function randomToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type GameRow = {
  id: string;
  code: string;
  status: string;
  fen: string;
  turn: string;
  white_name: string | null;
  black_name: string | null;
  white_session: string | null;
  black_session: string | null;
  minutes: number;
  increment: number;
  rated: boolean;
  is_public: boolean;
  white_ms: number;
  black_ms: number;
  last_move_at: string | null;
  result: string | null;
  result_reason: string | null;
  draw_offer_by: string | null;
  rematch_offer_by: string | null;
  rematch_game_code: string | null;
  pgn: string;
};

function loadChess(pgn: string, fen: string) {
  const chess = new Chess();
  if (pgn && pgn.trim().length > 0) {
    try {
      chess.loadPgn(pgn);
      return chess;
    } catch {
      /* fall through to FEN */
    }
  }
  chess.load(fen);
  return chess;
}

async function fetchGame(code: string): Promise<GameRow> {
  const db = await admin();
  const { data, error } = await db
    .from("games")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Game not found");
  return data as GameRow;
}

async function verifySeat(gameId: string, token: string): Promise<"w" | "b"> {
  const db = await admin();
  const { data } = await db
    .from("game_tokens")
    .select("color")
    .eq("game_id", gameId)
    .eq("token", token)
    .maybeSingle();
  if (!data) throw new Error("You are not a player in this game");
  return data.color as "w" | "b";
}

function drawReason(chess: Chess): string {
  if (chess.isStalemate()) return "stalemate";
  if (chess.isInsufficientMaterial()) return "insufficient material";
  if (chess.isThreefoldRepetition()) return "threefold repetition";
  return "fifty-move rule";
}

async function finishGame(
  game: GameRow,
  result: string,
  reason: string,
  extra: { white_ms?: number; black_ms?: number } = {},
) {
  const db = await admin();
  await db
    .from("games")
    .update({
      status: "finished",
      result,
      result_reason: reason,
      ended_at: new Date().toISOString(),
      draw_offer_by: null,
      updated_at: new Date().toISOString(),
      ...extra,
    })
    .eq("id", game.id);
  return { result, reason };
}

/** Remaining clock for the side to move, accounting for elapsed time. */
function remainingForMover(game: GameRow) {
  const base = game.turn === "w" ? game.white_ms : game.black_ms;
  if (game.status !== "active" || !game.last_move_at) return base;
  const elapsed = Date.now() - new Date(game.last_move_at).getTime();
  return base - elapsed;
}

function unwrapInput(d: unknown): unknown {
  if (typeof d === "object" && d !== null && "data" in d) {
    return (d as { data: unknown }).data;
  }
  return d;
}

export const createGame = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const raw = unwrapInput(d);
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(24),
        sessionId: z.string().optional(),
        minutes: z.number().int().min(1).max(180),
        increment: z.number().int().min(0).max(60),
        color: z.enum(["white", "black", "random"]),
        rated: z.boolean(),
        isPublic: z.boolean(),
      })
      .parse(raw);
    const sessionId =
      parsed.sessionId && parsed.sessionId.length >= 4
        ? parsed.sessionId
        : randomToken().slice(0, 16);
    return { ...parsed, sessionId };
  })
  .handler(async ({ data }) => {
    const db = await admin();
    const color: "w" | "b" =
      data.color === "random"
        ? Math.random() < 0.5
          ? "w"
          : "b"
        : data.color === "white"
          ? "w"
          : "b";
    const ms = data.minutes * 60_000;
    const token = randomToken();

    for (let attempt = 0; attempt < 6; attempt++) {
      const code = randomCode();
      const { data: game, error } = await db
        .from("games")
        .insert({
          code,
          status: "waiting",
          minutes: data.minutes,
          increment: data.increment,
          rated: data.rated,
          is_public: data.isPublic,
          white_ms: ms,
          black_ms: ms,
          white_name: color === "w" ? data.name : null,
          black_name: color === "b" ? data.name : null,
          white_session: color === "w" ? data.sessionId : null,
          black_session: color === "b" ? data.sessionId : null,
        })
        .select("id, code")
        .single();
      if (error) {
        console.error("[createGame] insert error:", error);
        if (error.code === "23505") continue; // Unique constraint violation (duplicate code), retry
        throw new Error(`Failed to create room: ${error.message}`);
      }
      if (!game) continue;
      const { error: tokenError } = await db.from("game_tokens").insert({
        game_id: game.id,
        color,
        token,
        session_id: data.sessionId,
      });
      if (tokenError) {
        console.error("[createGame] token error:", tokenError);
        throw new Error(`Failed to save room token: ${tokenError.message}`);
      }
      return { code: game.code, color, token };
    }
    throw new Error("Could not create a room code, please try again");
  });

export const joinGame = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const raw = unwrapInput(d);
    const parsed = z
      .object({
        code: z.string().trim().min(4).max(12),
        name: z.string().trim().min(1).max(24),
        sessionId: z.string().optional(),
      })
      .parse(raw);
    const sessionId =
      parsed.sessionId && parsed.sessionId.length >= 4
        ? parsed.sessionId
        : randomToken().slice(0, 16);
    return { ...parsed, sessionId };
  })
  .handler(async ({ data }) => {
    const db = await admin();
    const game = await fetchGame(data.code);

    // Reconnect: this session already owns a seat.
    const { data: existing } = await db
      .from("game_tokens")
      .select("color, token")
      .eq("game_id", game.id)
      .eq("session_id", data.sessionId)
      .maybeSingle();
    if (existing) {
      return { code: game.code, color: existing.color as "w" | "b", token: existing.token };
    }

    const freeColor: "w" | "b" | null = !game.white_session
      ? "w"
      : !game.black_session
        ? "b"
        : null;
    if (!freeColor) throw new Error("This game already has two players");

    const token = randomToken();
    const now = new Date().toISOString();
    await db
      .from("games")
      .update({
        ...(freeColor === "w"
          ? { white_name: data.name, white_session: data.sessionId }
          : { black_name: data.name, black_session: data.sessionId }),
        status: "active",
        started_at: now,
        last_move_at: now,
        updated_at: now,
      })
      .eq("id", game.id);
    await db
      .from("game_tokens")
      .insert({ game_id: game.id, color: freeColor, token, session_id: data.sessionId });

    return { code: game.code, color: freeColor, token };
  });

export const makeMove = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z.string().trim().min(4).max(12),
        token: z.string().min(8).max(128),
        from: z.string().regex(/^[a-h][1-8]$/),
        to: z.string().regex(/^[a-h][1-8]$/),
        promotion: z.enum(["q", "r", "b", "n"]).optional(),
      })
      .parse(unwrapInput(d)),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const game = await fetchGame(data.code);
    const color = await verifySeat(game.id, data.token);

    if (game.status !== "active") throw new Error("This game is not in progress");
    if (game.turn !== color) throw new Error("It is not your turn");

    // Server-side clock enforcement.
    const left = remainingForMover(game);
    if (left <= 0) {
      const result = color === "w" ? "0-1" : "1-0";
      await finishGame(game, result, "timeout", color === "w" ? { white_ms: 0 } : { black_ms: 0 });
      return { ok: false, reason: "timeout" as const };
    }

    const chess = loadChess(game.pgn, game.fen);
    let move;
    try {
      move = chess.move({ from: data.from, to: data.to, promotion: data.promotion ?? "q" });
    } catch {
      throw new Error("Illegal move");
    }
    if (!move) throw new Error("Illegal move");

    const msLeft = left + game.increment * 1000;
    const now = new Date().toISOString();
    const history = chess.history();
    const ply = history.length;

    let status = "active";
    let result: string | null = null;
    let reason: string | null = null;
    if (chess.isCheckmate()) {
      status = "finished";
      result = color === "w" ? "1-0" : "0-1";
      reason = "checkmate";
    } else if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
      status = "finished";
      result = "1/2-1/2";
      reason = drawReason(chess);
    }

    await db
      .from("games")
      .update({
        fen: chess.fen(),
        turn: chess.turn(),
        pgn: chess.pgn(),
        ...(color === "w" ? { white_ms: msLeft } : { black_ms: msLeft }),
        last_move_at: now,
        updated_at: now,
        draw_offer_by: null,
        status,
        result,
        result_reason: reason,
        ended_at: status === "finished" ? now : null,
      })
      .eq("id", game.id);

    await db.from("game_moves").insert({
      game_id: game.id,
      ply,
      color,
      san: move.san,
      uci: `${move.from}${move.to}${move.promotion ?? ""}`,
      fen_after: chess.fen(),
      ms_left: msLeft,
    });

    return { ok: true as const, san: move.san, status, result, reason };
  });

export const claimTimeout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ code: z.string().trim().min(4).max(12) }).parse(unwrapInput(d)),
  )
  .handler(async ({ data }) => {
    const game = await fetchGame(data.code);
    if (game.status !== "active") return { ok: false as const };
    if (remainingForMover(game) > 0) return { ok: false as const };
    const loser = game.turn as "w" | "b";
    await finishGame(
      game,
      loser === "w" ? "0-1" : "1-0",
      "timeout",
      loser === "w" ? { white_ms: 0 } : { black_ms: 0 },
    );
    return { ok: true as const };
  });

export const resignGame = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({ code: z.string().min(4).max(12), token: z.string().min(8).max(128) })
      .parse(unwrapInput(d)),
  )
  .handler(async ({ data }) => {
    const game = await fetchGame(data.code);
    const color = await verifySeat(game.id, data.token);
    if (game.status === "finished") return { ok: false as const };
    await finishGame(game, color === "w" ? "0-1" : "1-0", "resignation");
    return { ok: true as const };
  });

export const drawAction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z.string().min(4).max(12),
        token: z.string().min(8).max(128),
        action: z.enum(["offer", "accept", "decline"]),
      })
      .parse(unwrapInput(d)),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const game = await fetchGame(data.code);
    const color = await verifySeat(game.id, data.token);
    if (game.status !== "active") throw new Error("This game is not in progress");

    if (data.action === "offer") {
      await db
        .from("games")
        .update({ draw_offer_by: color, updated_at: new Date().toISOString() })
        .eq("id", game.id);
      return { ok: true as const };
    }
    if (!game.draw_offer_by || game.draw_offer_by === color)
      throw new Error("No draw offer to answer");
    if (data.action === "decline") {
      await db
        .from("games")
        .update({ draw_offer_by: null, updated_at: new Date().toISOString() })
        .eq("id", game.id);
      return { ok: true as const };
    }
    await finishGame(game, "1/2-1/2", "agreement");
    return { ok: true as const };
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z.string().min(4).max(12),
        token: z.string().min(8).max(128),
        body: z.string().trim().min(1).max(280),
      })
      .parse(unwrapInput(d)),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const game = await fetchGame(data.code);
    const color = await verifySeat(game.id, data.token);

    // Basic spam protection: max 5 messages per 10 seconds per seat.
    const since = new Date(Date.now() - 10_000).toISOString();
    const { count } = await db
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("game_id", game.id)
      .eq("sender_color", color)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) throw new Error("Slow down a little");

    await db.from("chat_messages").insert({
      game_id: game.id,
      sender_name: (color === "w" ? game.white_name : game.black_name) ?? "Player",
      sender_color: color,
      body: data.body,
    });
    return { ok: true as const };
  });

export const requestRematch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({ code: z.string().min(4).max(12), token: z.string().min(8).max(128) })
      .parse(unwrapInput(d)),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const game = await fetchGame(data.code);
    const color = await verifySeat(game.id, data.token);
    if (game.status !== "finished") throw new Error("Finish the game first");
    if (game.rematch_game_code) {
      const next = await fetchGame(game.rematch_game_code);
      const { data: seat } = await db
        .from("game_tokens")
        .select("color, token")
        .eq("game_id", next.id)
        .eq("color", color === "w" ? "b" : "w")
        .maybeSingle();
      return {
        code: next.code,
        color: (seat?.color ?? (color === "w" ? "b" : "w")) as "w" | "b",
        token: seat?.token ?? "",
      };
    }
    if (game.rematch_offer_by && game.rematch_offer_by !== color) {
      // Both sides agreed — create the new game with swapped colours.
      const ms = game.minutes * 60_000;
      const now = new Date().toISOString();
      const code = randomCode();
      const { data: created } = await db
        .from("games")
        .insert({
          code,
          status: "active",
          minutes: game.minutes,
          increment: game.increment,
          rated: game.rated,
          is_public: game.is_public,
          white_ms: ms,
          black_ms: ms,
          white_name: game.black_name,
          black_name: game.white_name,
          white_session: game.black_session,
          black_session: game.white_session,
          started_at: now,
          last_move_at: now,
        })
        .select("id, code")
        .maybeSingle();
      if (!created) throw new Error("Could not start the rematch");
      const whiteToken = randomToken();
      const blackToken = randomToken();
      await db.from("game_tokens").insert([
        { game_id: created.id, color: "w", token: whiteToken, session_id: game.black_session! },
        { game_id: created.id, color: "b", token: blackToken, session_id: game.white_session! },
      ]);
      await db
        .from("games")
        .update({ rematch_game_code: created.code, updated_at: now })
        .eq("id", game.id);
      const myColor: "w" | "b" = color === "w" ? "b" : "w";
      return {
        code: created.code,
        color: myColor,
        token: myColor === "w" ? whiteToken : blackToken,
      };
    }
    await db
      .from("games")
      .update({ rematch_offer_by: color, updated_at: new Date().toISOString() })
      .eq("id", game.id);
    return { code: null, color, token: null };
  });

export const quickMatch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(24),
        sessionId: z.string().min(4).max(64),
        minutes: z.number().int().min(1).max(180),
        increment: z.number().int().min(0).max(60),
        rated: z.boolean(),
      })
      .parse(unwrapInput(d)),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    // Drop stale queue entries.
    await db
      .from("matchmaking_queue")
      .delete()
      .is("game_id", null)
      .lt("created_at", new Date(Date.now() - 120_000).toISOString());

    const { data: waiting } = await db
      .from("matchmaking_queue")
      .select("id, session_id, player_name")
      .eq("minutes", data.minutes)
      .eq("increment", data.increment)
      .eq("rated", data.rated)
      .is("game_id", null)
      .neq("session_id", data.sessionId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (waiting) {
      const ms = data.minutes * 60_000;
      const now = new Date().toISOString();
      const code = randomCode();
      const { data: created } = await db
        .from("games")
        .insert({
          code,
          status: "active",
          minutes: data.minutes,
          increment: data.increment,
          rated: data.rated,
          is_public: true,
          white_ms: ms,
          black_ms: ms,
          white_name: waiting.player_name,
          black_name: data.name,
          white_session: waiting.session_id,
          black_session: data.sessionId,
          started_at: now,
          last_move_at: now,
        })
        .select("id, code")
        .maybeSingle();
      if (!created) throw new Error("Matchmaking failed, try again");
      const whiteToken = randomToken();
      const blackToken = randomToken();
      await db.from("game_tokens").insert([
        { game_id: created.id, color: "w", token: whiteToken, session_id: waiting.session_id },
        { game_id: created.id, color: "b", token: blackToken, session_id: data.sessionId },
      ]);
      await db.from("matchmaking_queue").update({ game_id: created.id }).eq("id", waiting.id);
      return { matched: true as const, code: created.code, color: "b" as const, token: blackToken };
    }

    await db.from("matchmaking_queue").upsert(
      {
        session_id: data.sessionId,
        player_name: data.name,
        minutes: data.minutes,
        increment: data.increment,
        rated: data.rated,
        game_id: null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    );
    return { matched: false as const };
  });

export const pollQueue = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ sessionId: z.string().min(4).max(64) }).parse(unwrapInput(d)),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db
      .from("matchmaking_queue")
      .select("game_id")
      .eq("session_id", data.sessionId)
      .maybeSingle();
    if (!row?.game_id) return { matched: false as const };
    const { data: game } = await db
      .from("games")
      .select("code")
      .eq("id", row.game_id)
      .maybeSingle();
    const { data: seat } = await db
      .from("game_tokens")
      .select("color, token")
      .eq("game_id", row.game_id)
      .eq("session_id", data.sessionId)
      .maybeSingle();
    await db.from("matchmaking_queue").delete().eq("session_id", data.sessionId);
    if (!game || !seat) return { matched: false as const };
    return {
      matched: true as const,
      code: game.code,
      color: seat.color as "w" | "b",
      token: seat.token,
    };
  });

export const leaveQueue = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ sessionId: z.string().min(4).max(64) }).parse(unwrapInput(d)),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    await db
      .from("matchmaking_queue")
      .delete()
      .eq("session_id", data.sessionId)
      .is("game_id", null);
    return { ok: true as const };
  });

export const getPublicRooms = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data, error } = await db
    .from("games")
    .select("id, code, minutes, increment, rated, white_name, black_name, created_at")
    .eq("status", "waiting")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);

  return (data ?? []).filter((room) => {
    const host = (room.white_name || room.black_name || "").toLowerCase();
    const code = (room.code || "").toLowerCase();
    return (
      !host.includes("testuser") &&
      !host.includes("test user") &&
      !host.includes("test_user") &&
      !code.includes("test")
    );
  });
});
