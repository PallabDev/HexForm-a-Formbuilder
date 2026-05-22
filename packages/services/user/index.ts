import {
    createUserWithEmailAndPasswordInput,
    CreateUserWithEmailAndPasswordInputType,
    generateUserTokenPayload,
    generateUserTokenPayloadType,
    signInUserWithEmailAndPasswordInput,
    SignInUserWithEmailAndPasswordInputType
} from './model'
import { db, eq } from '@repo/database'
import { usersTable } from '@repo/database/models/user'
import * as JWT from "jsonwebtoken"
import { createHmac, randomBytes, } from "node:crypto"
import { env } from '../env'
class UserService {
    private async getUserByEmail(email: string) {
        const result = await db.select().from(usersTable).where(eq(usersTable.email, email));
        if (!result || result.length === 0) return null;
        return result[0];
    }

    private async generateUserToken(payload: generateUserTokenPayloadType) {
        const { id } = await generateUserTokenPayload.parseAsync(payload)
        const token = JWT.sign(
            { id }, env.JWT_SECRET
        )
        return { token }
    }

    private generateHash(password: string, salt: string) {
        return createHmac('sha256', salt).update(password).digest("hex");
    }

    public async createUserWithEmailAndPassword(payload: CreateUserWithEmailAndPasswordInputType) {
        // Bussiness Logic

        const { fullName, email, password } = await createUserWithEmailAndPasswordInput.parseAsync(payload);

        // check user already exists or not
        const existingUserWithEmail = await this.getUserByEmail(email);

        if (existingUserWithEmail) throw new Error(`user with email ${email} already exists`);

        const salt = randomBytes(16).toString("hex")

        const hash = this.generateHash(password, salt);

        // todo add email send logic here
        const createdUser = await db.insert(usersTable).values({
            fullName,
            email,
            password: hash,
            salt
        }).returning({
            id: usersTable.id
        })
        if (!createdUser || createdUser.length === 0 || !createdUser[0]?.id) throw new Error(`something went wrong while creating a user`)
        const userId = createdUser[0].id;


        const { token } = await this.generateUserToken({ id: userId })


        return {
            id: userId,
            token
        }

    }

    public async signInUserWithEmailAndPassword(payload: SignInUserWithEmailAndPasswordInputType) {
        const { email, password } = await signInUserWithEmailAndPasswordInput.parseAsync(payload)
        const user = await this.getUserByEmail(email);

        if (!user) throw new Error(`user with email ${email} does not exists`)
        if (!user.password || !user.salt) throw new Error(`Wrong login method`)


        const hash = this.generateHash(password, user.salt);
        if (user.password !== hash) throw new Error(`wrong password`)


        const { token } = await this.generateUserToken({ id: user.id })
        return {
            id: user.id,
            token
        }

    }

    private async verifyUserToken(token: string) {
        try {

            const verificationResult = JWT.verify(token, env.JWT_SECRET) as generateUserTokenPayloadType
            return verificationResult;
        } catch (error) {
            throw new Error(`Invalid Token`)
        }
    }

    private async getUserInfoById(id: string) {
        const [user] = await db.select({
            id: usersTable.id,
            email: usersTable.email,
            fullName: usersTable.fullName,
            profileImageUrl: usersTable.profileImageUrl

        }).from(usersTable).where(eq(usersTable.id, id)).limit(1)
        if (!user) throw new Error(`user with id ${id} does not exists`)
        return user
    }
    public async verfiyAndDecodeUserByToken(token: string) {
        const { id } = await this.verifyUserToken(token)
        const userInfo = await this.getUserInfoById(id)
        return {
            id: userInfo.id,
            email: userInfo.email,
            fullName: userInfo.fullName,
            profileImageUrl: userInfo.profileImageUrl
        }
    }

}

export default UserService
