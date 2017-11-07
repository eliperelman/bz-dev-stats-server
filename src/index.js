import express from 'express';
import cors from 'cors';
import envs from './initializeEnv';
import buildGraph from './buildGraph';
import checkJwt from './checkJwt';
import getStats from './getStats';
import phonebook from '../phonebook.json';

if (module.hot) {
  module.hot.accept(['./initializeEnv', './buildGraph', './checkJwt', './getStats']);
}

const app = express();
const port = process.env.PORT || 5090;
const ldapSubKey = 'ad|Mozilla-LDAP-Dev|';
const dc = email => `mail=${email},o=com,dc=mozilla`;
const root = dc('chris@mozilla.com');
const graph = buildGraph(phonebook, root);

app.use(cors());

app.get('/stats/:email?', checkJwt, async (request, response) => {
  const user = `${request.user.sub.replace(ldapSubKey, '')}@mozilla.com`;
  const id = request.params.email ? dc(request.params.email) : dc(user);

  if (request.params.email && !envs.ADMINS.includes(user)) {
    return response.sendStatus(401);
  }

  const self = graph.vertexValue(id);

  if (!self) {
    return response.sendStatus(404);
  }

  try {
    response.send(await getStats(id, graph));
  } catch (err) {
    console.error(err);
    response.sendStatus(500);
  }
});

app.listen(port, () => console.log(`Stats server running on :${port}`));
