import { prisma } from "../config/db.js";
//用bcrypt or bcryptjs幾乎都差不多，前者是核心部分用c++計算，透過node.js讓js調用。後者是純js
import bcrypt from "bcrypt";
import generateJwt from "../utils/generateToken.js";


/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const signup = async (req,res)=>{
    const { name, email, password} = req.body

    const allParasPresent = (name != null && email !=null && password !=null)

    if (!allParasPresent) {
        return res.status(401).json("Invalid format")
    }

   const userExists = await prisma.user.findUnique({
    where:{
        email:email
    }
   })

   if (userExists) {
    return res.status(400).json({
        error:"User alreay exists"
    })
   }

   //generate JWT
   const salt = await bcrypt.genSalt(10)
   const hashedPassword = await bcrypt.hash(password,salt)
   //也可以直接寫 const hashedPassword = bcrypt.hash(password,10) ，第二個參數是union type可放數字或字串

   const user = await prisma.user.create({
    data:{
        name,
        email,
       password:hashedPassword
    }
   })

   const token = generateJwt(user.id,res)



   return res.status(201).json({
    status:"success",
    data:{
        user:{
            id:user.id,
            name:name,
            email:email
        },
        token,
    }
   })






}

const login = async (req,res)=>{
    const {email,password} = req.body

    const existedUser = await prisma.user.findUnique({
        where:{email}
    })


    if (!existedUser) {
    return res.status(401).json("invalid email or password")
}


const correctPassword = await bcrypt.compare(password,existedUser.password)

if (!correctPassword) {
    return res.status(401).json("invalid email or password")
}

//generate JWT
const token = generateJwt(existedUser.id,res)

return res.status(200).json({
    "status":"success",
    "data":{
        name:existedUser.name,
    },
    token
})
}


const logout = async (req,res)=>{

    res.cookie("jwt","",{
        httpOnly:true,
        //new Date(0) 代表 Unix 時間戳 0 毫秒，也就是 1970-01-01 00:00:00 UTC，一個早就過去的時間點
        expires:new Date(0)

    })

      res.status(200).json({
        status:"success",
        message:"logged out successfully"
    });

}





export {signup,login,logout}