// Web Worker: runs the chess search off the main thread.
// Receives { fen, difficulty }, replies with { from, to } | null.
import { Chess } from 'chess.js'
import { getBestMove } from './AI.js'

self.onmessage = (e) => {
  const { fen, difficulty } = e.data
  const move = getBestMove(new Chess(fen), difficulty)
  self.postMessage(move)
}
