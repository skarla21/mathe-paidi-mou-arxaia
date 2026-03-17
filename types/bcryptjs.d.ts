declare module "bcryptjs" {
  const bcrypt: {
    hash(s: string, rounds: number): Promise<string>;
    compare(s: string, hash: string): Promise<boolean>;
  };
  export default bcrypt;
}
