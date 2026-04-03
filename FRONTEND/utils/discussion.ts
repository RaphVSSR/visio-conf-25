export const sortDiscussionsByLatestMessage = (discussions: any[]): any[] => {
  
  return [...discussions].sort((a, b) => {
    // Si une discussion n'a pas de last_message, elle va à la fin
    if (!a.last_message && !b.last_message) return 0;
    if (!a.last_message) return 1;
    if (!b.last_message) return -1;

    // Pour les discussions avec last_message, trier par date (plus récente en premier)
    const dateA = new Date(a.last_message.message_date_create);
    const dateB = new Date(b.last_message.message_date_create);
    return dateB.getTime() - dateA.getTime();
  });
};