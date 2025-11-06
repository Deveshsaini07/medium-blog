import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from 'hono/jwt';

const app = new Hono<{
	Bindings: {
		DATABASE_URL: string,
    JWT_SECRET: string
	}
}>();

// POST /api/v1/user/signup
// POST /api/v1/user/signin
// POST /api/v1/blog
// PUT /api/v1/blog
// GET /api/v1/blog/:id
// GET /api/v1/blog/bulk

app.post('/api/v1/user/signup',async (c) => {
  const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const body = await c.req.json();
    const {email,name,password} = body;
    await prisma.user.create({
      data:{
        name:name,
        email:email,
        password:password
      }
    });
    return c.text('successfully signed up')
  } catch (error) {
    c.status(403);
		return c.json({ error: "error while signing up" });
  }
})
app.post('/api/v1/user/signin',async (c) => {
  const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const body = await c.req.json();
    const {email,password} = body;
    type bodySchema = {
      id:string,
    };
    const user:bodySchema = await prisma.user.findUnique({
      where:{
        email:email,
        password:password
      },
      select:{
        id:true,
        password:false
      }
    }) || {id:''};
    if(user.id == ""){
      c.text('no user found');
      return;
    }
    //generate jwt
    const id = user?.id;
    const token = await sign({id:user.id},c.env?.JWT_SECRET);
    return c.json({token});
  } catch (error) {
    c.status(403);
		return c.json({ error: "error while signing in" });
  }
})
app.post('/api/v1/blog', (c) => {
  return c.text('Hello Hono!')
})
app.put('/api/v1/blog', (c) => {
  return c.text('Hello Hono!')
})
app.get('/api/v1/blog/:id', (c) => {
  return c.text('Hello Hono!')
})
app.get('/api/v1/blog/bulk', (c) => {
  return c.text('Hello Hono!')
})

export default app
