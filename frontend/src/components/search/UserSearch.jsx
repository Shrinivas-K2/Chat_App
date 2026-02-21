import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../../store/chatStore";
import { searchUsersApi } from "../../features/search/api/searchApi";
import { createPrivateRoomApi } from "../../features/chat/api/chatApi";
import { getApiErrorMessage } from "../../utils/apiError";

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const messagesByChat = useChatStore((state) => state.messagesByChat);
  const upsertChat = useChatStore((state) => state.upsertChat);
  const setActiveChat = useChatStore((state) => state.setActiveChat);

  useEffect(() => {
    const text = query.trim();
    if (!text) {
      setUserResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const users = await searchUsersApi(text);
        setUserResults(users);
        setError("");
      } catch {
        setUserResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const messageResults = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return [];

    return Object.values(messagesByChat)
      .flat()
      .filter((message) => (message.text || "").toLowerCase().includes(text))
      .slice(0, 4)
      .map((message) => ({
        id: `m-${message.id}`,
        chatId: message.chatId,
        label: `Msg: ${message.text}`,
      }));
  }, [query, messagesByChat]);

  const handleStartDirectChat = async (targetUserId) => {
    setIsCreating(true);
    setError("");
    try {
      const data = await createPrivateRoomApi({ targetUserId });
      if (data.room) {
        upsertChat(data.room);
        setActiveChat(data.room.id);
      } else if (data.requestPending) {
        setError("Private chat request sent. Wait for acceptance.");
      }
      setQuery("");
      navigate("/chat");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to start direct chat."));
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenMessageResult = (chatId) => {
    if (!chatId) return;
    setActiveChat(chatId);
    setQuery("");
    navigate("/chat");
  };

  const hasResults = userResults.length > 0 || messageResults.length > 0 || !!error;

  return (
    <div className="search-box">
      <input
        className="search-input"
        placeholder="Search users/messages"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {hasResults ? (
        <div className="search-results">
          {userResults.map((user) => (
            <div key={`u-${user.id}`} className="search-item-row">
              <span className="search-item-label">User: {user.name}</span>
              <button
                className="search-action-btn"
                onClick={() => handleStartDirectChat(user.id)}
                disabled={isCreating}
              >
                Start Chat
              </button>
            </div>
          ))}

          {messageResults.map((item) => (
            <button
              key={item.id}
              className="search-item search-item-btn"
              onClick={() => handleOpenMessageResult(item.chatId)}
            >
              {item.label}
            </button>
          ))}

          {error ? <div className="search-error">{error}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
