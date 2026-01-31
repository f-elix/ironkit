import { httpRouter, type GenericDataModel } from 'convex/server';
import type { CreateAuth } from '@convex-dev/better-auth';
import { authComponent, createAuth } from './auth';

const http = httpRouter();

authComponent.registerRoutes(http, createAuth as CreateAuth<GenericDataModel>);

export default http;
