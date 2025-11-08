import z from 'zod';


export const signUpInput = z.object({
    email:z.email(),
    name:z.string().optional(),
    password:z.string().min(1)
});
export type SignUpInput = z.infer<typeof signUpInput>;

export const signInInput = z.object({
    email:z.email(),
    password:z.string().min(1)
});
export type SignInInput = z.infer<typeof signInInput>; 

export const postInput = z.object({
    content:z.string().min(1),
    title:z.string().min(1)
});
export type PostInput = z.infer<typeof postInput>;

export const updatePostInput = z.object({
    content:z.string().optional(),
    title:z.string().optional()
})
export type UpdatePostInput = z.infer<typeof updatePostInput>

