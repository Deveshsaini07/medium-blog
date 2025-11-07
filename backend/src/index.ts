import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { jwt, sign, verify } from 'hono/jwt';
import { combineAfterGenerateHooks } from 'hono/ssg';

const app = new Hono<{
	Bindings: {
		DATABASE_URL: string,
    JWT_SECRET: string
	},
  Variables : {
		userId: string
	}
}>();

// POST /api/v1/user/signup
// POST /api/v1/user/signin
// POST /api/v1/blog
// PUT /api/v1/blog
// GET /api/v1/blog/:id
// GET /api/v1/blog/bulk


app.post('/api/v1/user/signup',async (c) => {
  console.log( c.env?.DATABASE_URL);
  
  const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const body = await c.req.json();
    console.log(body);
    
    const {email,name,password} = body;
    console.log(email,name,password);
    
    const data = await prisma.user.create({
      data:{
        name:name,
        email:email,
        password:password
      }
    });
    console.log(data);
    
    return c.text('successfully signed up')
  } catch (error) {
    c.status(403);
    console.log(error);
    
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

app.use('/api/v1/blog/*', async (c,next) => {
  try {
    const fullToken = c.req.header('Authorization');
    const token = fullToken || "";
    if(token == ""){
      c.status(403);
      return c.json({
        msg:"token invalid"
      })
    }
    const data = await verify(token,c.env.JWT_SECRET);
    if(!data){
      c.status(401);
		  return c.json({ error: "unauthorized" });
    }
    c.set("userId",data.id as string);
    console.log("auth done");
    await next();
  } catch (error) {
    c.status(500);
		return c.json({ error: "unable to authorize" });
  }
})

app.post('/api/v1/blog',async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl:c.env?.DATABASE_URL
  }).$extends(withAccelerate()); 
  type bodySchema = {
    title:string,
    content:string,
  }
  try {
    const authorId = c.get('userId');
    const body:bodySchema = await c.req.json();
    const {title,content} = body;
    const data = await prisma.post.create({
      data:{
        title:title,
        content:content,
        authorId:authorId
      }
    });
    if(!data){
      c.status(500);
      return c.json({
        error:"couldnt create the post"
      });
    }
    c.status(200);
    return c.json({
      data
    })
  } catch (error) {
    c.status(500);
    return c.json({
        error:"error in blog post"
    });
  }
})
app.put('/api/v1/blog',async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl:c.env?.DATABASE_URL
  }).$extends(withAccelerate()); 
  type bodySchema = {
    postId:string,
    title:string,
    content:string,
  }
  try {
    const authorId = c.get('userId');
    const body:bodySchema = await c.req.json();
    const {postId,title,content} = body;
    const data = await prisma.post.update({
      where:{
        id:postId,
        authorId:authorId
      },
      data:{
        title:title,
        content:content,
      }
    });
    if(!data){
      c.status(500);
      return c.json({
        error:"couldnt update the post"
      });
    }
    c.status(200);
    return c.json({
      data
    })
  } catch (error) {
    c.status(500);
    return c.json({
        error:"error in updateing blog post"
    });
  }
})
app.get('/api/v1/blog/bulk',async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl:c.env?.DATABASE_URL
  }).$extends(withAccelerate()); 
  try {
    console.log("hello from bulk");
    
    const data = await prisma.post.findMany({});
    if(!data){
      c.status(500);
      return c.json({
        error:"couldnt find all the post"
      });
    }
    c.status(200);
    return c.json({
      data
    })
  } catch (error) {
    c.status(500);
    return c.json({
        error:"error in finding all blogs post"
    });
  }
})
app.get('/api/v1/blog/:id',async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl:c.env?.DATABASE_URL
  }).$extends(withAccelerate()); 
  try {
    const postId = c.req.param('id');
    const data = await prisma.post.findUnique({
      where:{
        id:postId,
      },
    });
    if(!data){
      c.status(500);
      return c.json({
        error:"couldnt find the post"
      });
    }
    c.status(200);
    return c.json({
      data
    })
  } catch (error) {
    c.status(500);
    return c.json({
        error:"error in finding blog post"
    });
  }
})


export default app
