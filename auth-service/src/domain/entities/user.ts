export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}