import { useCallback, useEffect, useRef, useState } from "react";

export type EngineEvaluation = { type: "cp"; value: number } | { type: "mate"; value: number };

type EngineRequest = {
  fen: string;
  depth: number;
  skill: number;
  onBestMove: (uci: string) => void;
  onEval?: (evalData: EngineEvaluation) => void;
};

/** Real Stockfish 18 (WASM, lite single-threaded) running in a Web Worker. */
export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<((uci: string) => void) | null>(null);
  const evalCbRef = useRef<((evalData: EngineEvaluation) => void) | null>(null);

  const [ready, setReady] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [evaluation, setEvaluation] = useState<EngineEvaluation | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const worker = new Worker("/engine/stockfish-18-lite-single.js");
    workerRef.current = worker;

    worker.onerror = (err) => {
      console.error("Stockfish worker error:", err);
      setThinking(false);
    };

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

      // Parse engine evaluation info line
      if (line.startsWith("info ") && line.includes("score ")) {
        const parts = line.split(" ");
        const scoreIndex = parts.indexOf("score");
        if (scoreIndex !== -1 && parts[scoreIndex + 1] && parts[scoreIndex + 2]) {
          const scoreType = parts[scoreIndex + 1];
          const scoreVal = parseInt(parts[scoreIndex + 2]!, 10);
          if (!isNaN(scoreVal)) {
            const res: EngineEvaluation =
              scoreType === "mate"
                ? { type: "mate", value: scoreVal }
                : { type: "cp", value: scoreVal };

            setEvaluation(res);
            evalCbRef.current?.(res);
          }
        }
      }

      if (line.startsWith("bestmove")) {
        const uci = line.split(" ")[1];
        setThinking(false);
        const cb = pendingRef.current;
        pendingRef.current = null;
        if (uci && uci !== "(none)" && cb) {
          cb(uci);
        }
      }
    };

    worker.postMessage("uci");

    return () => {
      worker.terminate();
      workerRef.current = null;
      pendingRef.current = null;
      evalCbRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    pendingRef.current = null;
    evalCbRef.current = null;
    setThinking(false);
    if (workerRef.current) {
      workerRef.current.postMessage("stop");
    }
  }, []);

  const requestMove = useCallback(({ fen, depth, skill, onBestMove, onEval }: EngineRequest) => {
    const worker = workerRef.current;
    if (!worker) return;
    pendingRef.current = onBestMove;
    evalCbRef.current = onEval ?? null;
    setThinking(true);
    worker.postMessage(`setoption name Skill Level value ${skill}`);
    worker.postMessage("ucinewgame");
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go depth ${depth}`);
  }, []);

  const evaluatePosition = useCallback((fen: string, depth = 12) => {
    const worker = workerRef.current;
    if (!worker) return;
    worker.postMessage("ucinewgame");
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go depth ${depth}`);
  }, []);

  return { ready, thinking, evaluation, requestMove, evaluatePosition, stop };
}
