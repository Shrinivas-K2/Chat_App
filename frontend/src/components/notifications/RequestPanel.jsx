import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPrivateRequestsApi,
  respondPrivateRequestApi,
} from "../../features/chat/api/chatApi";
import { useChatStore } from "../../store/chatStore";
import { getApiErrorMessage } from "../../utils/apiError";

export function RequestPanel() {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const upsertChat = useChatStore((state) => state.upsertChat);
  const setActiveChat = useChatStore((state) => state.setActiveChat);

  useEffect(() => {
    if (!open) return;

    let active = true;
    setLoading(true);
    setError("");

    getPrivateRequestsApi()
      .then((items) => {
        if (!active) return;
        setRequests(items);
      })
      .catch((err) => {
        if (!active) return;
        setError(getApiErrorMessage(err, "Failed to load requests."));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  const handleAction = async (roomId, action) => {
    try {
      const data = await respondPrivateRequestApi(roomId, action);
      setRequests((prev) => prev.filter((item) => item.roomId !== roomId));

      if (action === "APPROVE" && data.room) {
        upsertChat(data.room);
        setActiveChat(data.room.id);
        navigate("/chat");
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update request."));
    }
  };

  return (
    <div className="notification-wrap">
      <button className="mini-btn" onClick={() => setOpen((prev) => !prev)}>
        Requests ({requests.length})
      </button>

      {open ? (
        <div className="notification-card">
          <div className="notification-head">
            <strong>Private Requests</strong>
          </div>

          {loading ? <p>Loading...</p> : null}
          {error ? <p className="error-text">{error}</p> : null}

          {!loading && requests.length === 0 ? <p>No pending requests</p> : null}

          {requests.map((request) => (
            <div key={request.roomId} className="request-item">
              <p>
                <strong>{request.fromUser.name}</strong> wants to chat
              </p>
              <div className="request-actions">
                <button
                  className="mini-btn"
                  onClick={() => handleAction(request.roomId, "APPROVE")}
                >
                  Approve
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleAction(request.roomId, "REJECT")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
