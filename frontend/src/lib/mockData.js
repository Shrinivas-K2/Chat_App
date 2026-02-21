const now = Date.now();

export const demoUser = {
  id: "u1",
  name: "Shrinivas",
  email: "shrinivas@example.com",
  avatar: "S",
};

export const demoChats = [
  {
    id: "c1",
    type: "direct",
    title: "Ananya",
    avatar: "A",
    participants: ["u1", "u2"],
    online: true,
    lastMessageAt: now - 1000 * 60,
  },
  {
    id: "c2",
    type: "group",
    title: "Frontend Team",
    avatar: "FT",
    participants: ["u1", "u2", "u3", "u4"],
    online: false,
    lastMessageAt: now - 1000 * 120,
  },
];

export const demoMessagesByChat = {
  c1: [
    {
      id: "m1",
      chatId: "c1",
      senderId: "u2",
      text: "Hey, are we shipping the login flow today?",
      timestamp: now - 1000 * 60 * 10,
      status: "seen",
      edited: false,
      deleted: false,
    },
    {
      id: "m2",
      chatId: "c1",
      senderId: "u1",
      text: "Yes. UI is ready, wiring API next.",
      timestamp: now - 1000 * 60 * 8,
      status: "delivered",
      edited: false,
      deleted: false,
    },
  ],
  c2: [
    {
      id: "m3",
      chatId: "c2",
      senderId: "u3",
      text: "Standup at 10:30 AM.",
      timestamp: now - 1000 * 60 * 16,
      status: "seen",
      edited: false,
      deleted: false,
    },
  ],
};
