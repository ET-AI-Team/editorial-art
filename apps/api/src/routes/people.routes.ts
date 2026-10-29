import { PeopleDecisionBody, type PeopleDecisionBody as PeopleDecisionBodyT } from '@editorial-art/shared-types';
import { Router, type Request } from 'express';
import { asyncRoute } from '../lib/async-route';
import { ApiError } from '../lib/errors';
import { isUuid } from '../lib/ids';
import { realPeopleAllowed } from '../lib/real-people';
import { actorOf } from '../middleware/actor';
import { rateLimit } from '../middleware/rate-limit';
import { validateBody } from '../middleware/validate';
import { decidePerson, peopleView } from '../pipeline/people';
import { findOwned } from './requests.routes';

/**
 * The real people found in a story (pipeline/people.ts), and the editor's decision for each.
 * Only for actors the EA_REAL_PEOPLE gate allows; ownership as for every request route.
 */
export const peopleRouter = Router();

function assertGate(req: Request): void {
  if (!realPeopleAllowed(actorOf(req).role)) throw new ApiError('FORBIDDEN', 403, 'Real faces are not available to you.');
}

peopleRouter.get(
  '/requests/:requestId/people',
  asyncRoute(async (req, res) => {
    const row = await findOwned(req, req.params.requestId);
    assertGate(req);
    res.json(await peopleView(row));
  })
);

/** use | swap | symbolic | upload (with the URL of a photo AI Studio uploaded). Answers the updated list. */
peopleRouter.post(
  '/requests/:requestId/people/:likenessId/decision',
  rateLimit('batch'),
  validateBody(PeopleDecisionBody),
  asyncRoute(async (req, res) => {
    const row = await findOwned(req, req.params.requestId);
    assertGate(req);
    const likenessId = req.params.likenessId;
    if (!likenessId || !isUuid(likenessId)) throw ApiError.notFound('That person is not part of this article.');
    const body = req.body as PeopleDecisionBodyT;
    await decidePerson({ request: row, likenessId, action: body.action, url: body.url, actor: actorOf(req) });
    req.log?.info({ eaRequestId: row.publicId, action: body.action }, 'people_decision');
    const fresh = await findOwned(req, req.params.requestId);
    res.json(await peopleView(fresh));
  })
);
