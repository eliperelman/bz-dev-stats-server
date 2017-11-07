import { createClient } from '@eliperelman/bz';
import admin from 'firebase-admin'
import buildGraph from './buildGraph';
import serviceAccount from './firebaseCredentials';
import queries from './queries.json';
import phonebook from '../phonebook.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const dc = email => `mail=${email},o=com,dc=mozilla`;
const root = dc('chris@mozilla.com');
const bugzilla = createClient();
const graph = buildGraph(phonebook, root);

const fetchSingleStats = async (email, name) => {
  const statList = await Promise.all(Object
    .entries(queries)
    .map(async ([query, { search }]) => {
      const bugs = await bugzilla.searchBugs(Object.assign({}, search, { v1: email }));

      return { [query]: bugs.length };
    }, {}));

  return {
    name,
    email,
    stats: statList.reduce((stats, stat) => Object.assign(stats, stat), {})
  };
};

const fetchJob = async () => {
  const users = db.collection('users');
  const vertices = [...graph.vertices_topologically()];
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  for (const [id, direct] of vertices) {
    const { cn } = direct;
    const bugmail = direct.bugzillaemail || direct.bugmail || direct.mail;
    const employeeRef = users.doc(id);
    const statsRef = employeeRef.collection('stats');
    const { stats } = await fetchSingleStats(bugmail, cn);

    console.log(`Setting stats for ${id}`);
    await employeeRef.set({ name: cn, email: bugmail });
    await statsRef.add(Object.assign({}, stats, { date: new Date(date) }));
  }
};

fetchJob()
  .then(() => console.log('DONE!'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
