import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext.jsx';
import { saveSession } from '../utils/session.js';
import { AVATARS } from '../constants/events.js';

const DEFAULT_SETTINGS = { maxPlayers: 8, rounds: 3, drawTimeSeconds: 80 };

export default function LandingPage() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, listPublicRooms } = useGame();

  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [roomCode, setRoomCode] = useState('');
  const [publicRooms, setPublicRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    listPublicRooms().then((rooms) => {
      if (mounted) {
        setPublicRooms(rooms);
        setLoadingRooms(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [listPublicRooms]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return toast.error('Enter a name first');
    setSubmitting(true);
    const ack = await createRoom({
      hostName: name.trim(),
      isPrivate,
      settings: { ...settings, avatar },
    });
    setSubmitting(false);
    if (!ack?.success) return toast.error(ack?.message || 'Failed to create room');
    saveSession({ roomId: ack.roomId, playerId: ack.playerId, name: name.trim() });
    navigate(`/room/${ack.roomId}`);
  }

  async function handleJoin(e, codeOverride) {
    e?.preventDefault?.();
    const raw = (codeOverride || roomCode).trim();
    // If a full invite link was pasted, extract just the room code from the end of the URL
    const code = raw.includes('/room/')
      ? raw.split('/room/').pop().toUpperCase()
      : raw.toUpperCase();
    if (!name.trim()) return toast.error('Enter a name first');
    if (!code) return toast.error('Enter a room code');
    setSubmitting(true);
    const ack = await joinRoom({ roomId: code, playerName: name.trim(), avatar });
    setSubmitting(false);
    if (!ack?.success) return toast.error(ack?.message || 'Failed to join room');
    saveSession({ roomId: ack.roomId, playerId: ack.playerId, name: name.trim() });
    navigate(`/room/${ack.roomId}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl grid md:grid-cols-2 gap-6"
      >
        <div className="card p-6 flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-extrabold">
              Doodle <span className="text-[var(--color-primary)]">Duel</span>
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Draw, guess, and compete in real time with friends.
            </p>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              Your name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="e.g. Sam"
              className="w-full mt-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              Avatar
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center ${
                    avatar === a ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-hover)]'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 rounded-lg font-semibold ${mode === 'create' ? 'btn-primary' : 'bg-[var(--color-surface-hover)]'}`}
            >
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 rounded-lg font-semibold ${mode === 'join' ? 'btn-primary' : 'bg-[var(--color-surface-hover)]'}`}
            >
              Join Room
            </button>
          </div>

          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                Private room (invite link only)
              </label>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <SettingField
                  label="Players"
                  value={settings.maxPlayers}
                  min={2}
                  max={20}
                  onChange={(v) => setSettings((s) => ({ ...s, maxPlayers: v }))}
                />
                <SettingField
                  label="Rounds"
                  value={settings.rounds}
                  min={2}
                  max={10}
                  onChange={(v) => setSettings((s) => ({ ...s, rounds: v }))}
                />
                <SettingField
                  label="Draw time (s)"
                  value={settings.drawTimeSeconds}
                  min={15}
                  max={240}
                  onChange={(v) => setSettings((s) => ({ ...s, drawTimeSeconds: v }))}
                />
              </div>
              <button
                disabled={submitting}
                className="btn-primary rounded-lg py-2.5 font-semibold disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Room'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Room code or paste invite link"
                maxLength={200}
                className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)] tracking-widest font-mono"
              />
              <button
                disabled={submitting}
                className="btn-primary rounded-lg py-2.5 font-semibold disabled:opacity-50"
              >
                {submitting ? 'Joining...' : 'Join Room'}
              </button>
            </form>
          )}
        </div>

        <div className="card p-6 flex flex-col gap-3">
          <h2 className="font-semibold text-[var(--color-text-muted)] uppercase text-xs tracking-wide">
            Public rooms
          </h2>
          {loadingRooms ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-14 rounded-lg" />
              ))}
            </div>
          ) : publicRooms.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] italic m-auto">
              No public rooms right now — create one!
            </p>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-96">
              {publicRooms.map((r) => (
                <div
                  key={r.roomId}
                  className="flex items-center justify-between bg-[var(--color-bg)] rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="font-mono font-semibold">{r.roomId}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {r.playerCount}/{r.maxPlayers} players · {r.status.replace('_', ' ')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleJoin(e, r.roomId)}
                    disabled={submitting || r.status !== 'lobby'}
                    className="btn-primary rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SettingField({ label, value, onChange, min, max }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-[var(--color-text-muted)]">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2 py-1.5 outline-none focus:border-[var(--color-primary)]"
      />
    </div>
  );
}
