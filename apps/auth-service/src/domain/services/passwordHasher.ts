export interface PasswordHasher {
    hash(password: string): Promise<string>;

    compare(
        plainPassword: string,
        hash: string
    ): Promise<boolean>;
}