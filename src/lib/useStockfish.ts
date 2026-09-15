import { useCallback, useEffect, useRef, useState } from "react";

type EngineRequest = { fen: string; depth: number; skill: number; onBestMove: (uci: string) => void };

/** Real Stockfish 18 (WASM, lite single-threaded) running in a Web Worker. */
export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<((uci: string) => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const worker = new Worker("/engine/stockfish-18-lite-single.js");
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const line = typeof event.data === "string" ? event.data : String(event.data?.data ?? "");
      if (line.startsWith("uciok")) {
        worker.postMessage("isready");
        return;
      }
      if (line.startsWith("readyok")) {
        setReady(true);
        return;
      }
      if (line.startsWith("bestmove")) {
        const uci = line.split(" ")[1];
        setThinking(false);
        const cb = pendingRef.current;
        pendingRef.current = null;
        if (uci && uci !== "(none)" && cb) cb(uci);
      }
    };
    worker.postMessage("uci");

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const requestMove = useCallback(({ fen, depth, skill, onBestMove }: EngineRequest) => {
    const worker = workerRef.current;
    if (!worker) return;
    pendingRef.current = onBestMove;
    setThinking(true);
    worker.postMessage(`setoption name Skill Level value ${skill}`);
    worker.postMessage("ucinewgame");
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go depth ${depth}`);
  }, []);

  return { ready, thinking, requestMove };
}
