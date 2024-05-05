import { AutoRouter, withContent, cors } from 'itty-router';
import PeerService from './peers';

export default (env: Env) => {
  const { preflight, corsify } = cors();
  const router = AutoRouter({
    base: '/signal',
    before: [preflight],
    finally: [corsify],
  });

  const peers = new PeerService(env.DB);

  router.get('/debug', async () => {
    return Response.json(await peers.debug());
  });

  router.get('/peers', async () => {
    return Response.json(await peers.getPeers());
  });

  router.put('/peers/:id', async ({ params }) => {
    return Response.json(await peers.registerPeer(params.id));
  });

  router.get('/peers/:id/sessions', async ({ params }) => {
    return Response.json(await peers.getSessions(params.id));
  });

  router.get('/sessions/:id', async ({ params }) => {
    return Response.json(await peers.getSession(params.id));
  });

  router.put('/sessions', withContent, async ({ content }) => {
    return Response.json(await peers.createSession(content));
  });

  router.put('/sessions/:id/complete', async ({ params }) => {
    return Response.json(await peers.completeSession(params.id));
  });

  router.put(
    '/sessions/:id/answer',
    withContent,
    async ({ params, content }) => {
      return Response.json(await peers.answerSession(params.id, content));
    }
  );

  router.delete('/all', async () => Response.json(await peers.nuke()));

  // 404 for everything else
  router.all('*', () => new Response('Not Found.', { status: 404 }));

  return router;
};
