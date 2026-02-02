/**
 * Utility functions to map MongoDB documents to GraphQL types
 * Converts _id to id and handles Mongoose document properties
 */

export function mapAccountToGraphQL(account: any): any {
  if (!account) return null;
  
  const doc = account.toObject ? account.toObject() : account;
  return {
    id: doc._id?.toString() || doc.id,
    ...doc,
  };
}

export function mapSiteToGraphQL(site: any): any {
  if (!site) return null;
  
  const doc = site.toObject ? site.toObject() : site;
  return {
    id: doc._id?.toString() || doc.id,
    ...doc,
  };
}

export function mapVisitorSessionToGraphQL(session: any): any {
  if (!session) return null;
  
  const doc = session.toObject ? session.toObject() : session;
  return {
    id: doc._id?.toString() || doc.id,
    ...doc,
  };
}

export function mapWebhookToGraphQL(webhook: any): any {
  if (!webhook) return null;
  
  const doc = webhook.toObject ? webhook.toObject() : webhook;
  return {
    id: doc._id?.toString() || doc.id,
    ...doc,
  };
}

export function mapArrayToGraphQL<T>(items: T[], mapper: (item: T) => any): any[] {
  if (!items) return [];
  return items.map(mapper);
}
