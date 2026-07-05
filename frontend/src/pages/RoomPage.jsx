import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGame } from '../context/GameContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { loadSession, saveSession, clearSession } from '../utils/session.js';
import PlayerList from '../components/PlayerList.jsx';
import ChatBox from '../components/ChatBox.jsx';
import DrawingBoard from '../components/DrawingBoard.jsx';
import TimerRing from '../components/TimerRing.jsx';
import HintDisplay from '../components/HintDisplay.jsx';
import WordChoiceModal from '../components/WordChoiceModal.jsx';
import { RoundEndOverlay, GameOverOverlay } from '../components/GameOverlays.jsx';

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { isConnected } = useSocket();
  const {
    room,
    playerId,
    messages,
    wordOptions,
    secondsLeft,
    timerPhase,
    roundResult,
    gameOverResult,
    joinRoom,
    toggleReady,
    startGame,
    selectWord,
    sendChat,
    sendGuess,
    leaveRoom,
    resetGameState,
  } = useGame();

  const [rejoining, setRejoining] = useState(!room);

  // Handles: fresh page load / refresh, where React state is empty but
  // we may have a saved session for this exact room to reconnect into.
  useEffect(() => {
    if (room || !isConnected) return;
    const session = loadSession();
    if (session?.roomId === roomId && session?.name) {
      joinRoom({ roomId, playerName: session.name }).then((ack) => {
        setRejoining(false);
        if (!ack?.success) {
          toast.error(ack?.message || 'Could not rejoin room');
          navigate('/');
        } else {
          saveSession({ roomId, playerId: ack.playerId, name: session.name });
        }
      });
    } else {
      setRejoining(false);
      toast.error('No active session for this room');
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, room, roomId]);

  useEffect(() => {
    if (room && room.roomId !== roomId) {
      // stale state from a previous room — force resync
      navigate(`/room/${room.roomId}`, { replace: true });
    }
  }, [room, roomId, navigate]);

  function handlePlayAgain() {
    leaveRoom();
    clearSession();
    resetGameState();
    navigate('/');
  }

  if (rejoining || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton w-64 h-10 rounded-lg" />
      </div>
    );
  }

  const isHost = room.hostId === playerId;
  const me = room.players.find((p) => p.id === playerId);
  const isDrawer = me?.isDrawer;
  const isLobby = room.status === 'lobby';

  return (
    <div className="min-h-screen p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between card px-4 py-3">
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">Room code</p>
          <p className="font-mono font-bold text-lg tracking-widest">{room.roomId}</p>
        </div>
        {!isLobby && (
          <div className="flex items-center gap-4">
            <TimerRing secondsLeft={secondsLeft} totalSeconds={room.settings.drawTimeSeconds} />
            <HintDisplay wordLength={room.wordLength} revealedHints={room.revealedHints} />
          </div>
        )}
        <button
          onClick={() => {
            leaveRoom();
            clearSession();
            resetGameState();
            navigate('/');
          }}
          className="text-sm bg-[var(--color-surface-hover)] px-3 py-1.5 rounded-lg"
        >
          Leave
        </button>
      </header>

      {isLobby ? (
        <LobbyView room={room} isHost={isHost} me={me} onToggleReady={toggleReady} onStart={startGame} />
      ) : (
        <div className="grid md:grid-cols-[220px_1fr_260px] gap-4 flex-1 relative">
          <PlayerList players={room.players} hostId={room.hostId} currentPlayerId={playerId} />
          <div className="relative">
            <DrawingBoard isDrawer={isDrawer} />
            <WordChoiceModal options={isDrawer ? wordOptions : null} onSelect={selectWord} />
            <RoundEndOverlay result={roundResult} />
            <GameOverOverlay result={gameOverResult} onPlayAgain={handlePlayAgain} />
          </div>
          <ChatBox
            messages={messages}
            onSend={me?.hasGuessedCorrectly || isDrawer ? sendChat : sendGuess}
            disabled={false}
            placeholder={isDrawer ? 'Chat...' : me?.hasGuessedCorrectly ? 'Chat...' : 'Type your guess...'}
          />
        </div>
      )}
    </div>
  );
}

function LobbyView({ room, isHost, me, onToggleReady, onStart }) {
  const connectedCount = room.players.filter((p) => p.connected).length;
  const canStart = isHost && connectedCount >= 2;

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-4 flex-1">
      <div className="card p-8 flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Waiting for players...</h2>
        <p className="text-[var(--color-text-muted)] text-sm max-w-md">
          Share the room code <span className="font-mono font-bold text-[var(--color-accent)]">{room.roomId}</span>{' '}
          with friends, or send them the invite link.
        </p>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            toast.success('Invite link copied!');
          }}
          className="bg-[var(--color-surface-hover)] px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Copy invite link
        </button>

        <div className="flex gap-3 mt-4">
          {!isHost && (
            <button
              onClick={onToggleReady}
              className={`rounded-lg px-5 py-2.5 font-semibold ${me?.isReady ? 'bg-[var(--color-success)] text-black' : 'bg-[var(--color-surface-hover)]'}`}
            >
              {me?.isReady ? "I'm ready ✓" : 'Ready up'}
            </button>
          )}
          {isHost && (
            <button
              onClick={onStart}
              disabled={!canStart}
              className="btn-primary rounded-lg px-6 py-2.5 font-semibold disabled:opacity-40"
              title={!canStart ? 'Need at least 2 players' : ''}
            >
              Start Game
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          {room.settings.rounds} rounds · {room.settings.drawTimeSeconds}s per round · max {room.settings.maxPlayers} players
        </p>
      </div>
      <PlayerList players={room.players} hostId={room.hostId} currentPlayerId={me?.id} />
    </div>
  );
}
