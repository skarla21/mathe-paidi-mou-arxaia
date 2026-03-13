declare module "h3" {
  interface H3EventContext {
    auth?: {
      userId: string | null;
      isAdmin: boolean;
    };
  }
}
