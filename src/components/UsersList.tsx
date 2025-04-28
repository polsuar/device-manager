import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { List, ListItem, ListItemText, Typography, Paper, Box, Collapse, IconButton } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";

interface User {
  id: string;
  events: Array<{
    id: string;
    data: any;
  }>;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);

        const usersData = await Promise.all(
          usersSnapshot.docs.map(async (userDoc) => {
            const eventsCollection = collection(userDoc.ref, "EVENTS");
            const eventsSnapshot = await getDocs(eventsCollection);

            const events = eventsSnapshot.docs.map((eventDoc) => ({
              id: eventDoc.id,
              data: eventDoc.data(),
            }));

            return {
              id: userDoc.id,
              events,
            };
          })
        );

        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleUserClick = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const formatEventData = (data: any) => {
    const eventType = Object.keys(data)[0];
    const eventData = data[eventType];
    return {
      type: eventType,
      ...eventData,
    };
  };

  return (
    <Paper sx={{ p: 2, height: "100%", overflowY: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Users and Events
      </Typography>
      <List>
        {users.map((user) => (
          <Box key={user.id}>
            <ListItem button onClick={() => handleUserClick(user.id)} sx={{ bgcolor: "background.paper" }}>
              <ListItemText primary={`User: ${user.id}`} secondary={`${user.events.length} events`} />
              {expandedUser === user.id ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={expandedUser === user.id} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {user.events.map((event) => (
                  <ListItem key={event.id} sx={{ pl: 4, bgcolor: "action.hover" }}>
                    <ListItemText
                      primary={`Event: ${event.id}`}
                      secondary={
                        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{JSON.stringify(formatEventData(event.data), null, 2)}</pre>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}
      </List>
    </Paper>
  );
}
