import admin from 'firebase-admin'
import serviceAccount from './firebaseCredentials';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const users = db.collection('users');
const statsForUser = async (id, { cn }) => {
  const snapshot = await users
    .doc(id)
    .collection('stats')
    .get();

  return {
    id,
    name: cn,
    stats: snapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  };
};

export default (id, graph) => {
  const self = graph.vertexValue(id);
  const directs = [...graph.verticesWithPathFrom(id)];

  return Promise.all([
    statsForUser(id, self),
    ...directs.map(([id, user]) => statsForUser(id, user))
  ]);
};
