
import express from "express"
import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"


export default async function autenticateToken(req: Request, res: Response, next: NextFunction){

	const authHeader = req.headers["authorization"];
	let token = authHeader && authHeader.split(" ")[1];

	if (!token) {

		if (req.headers.cookie){

			const cookies = req.headers.cookie.split(";").reduce((acc, cookie) => {
	
				const [key, value] = cookie.trim().split("=");
				acc[key] = value;
				return acc;
	
			}, {})

			//token = cookies.token;

		}else {

			return res.status(401).json({ error: "Access token required" })

		}
		
	}

	try {
		
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		const user = await User.findById(decoded.userId);

		if (user) {
			
			req.user = user;
			next();

		}else {
			
			return res.status(401).json({ error: "User not found" });

		};

	} catch (error) {
		
		return res.status(403).json({ error: "Invalid token" });

	}

}