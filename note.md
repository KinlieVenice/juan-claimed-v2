TS Request Files are only compiler validator not runtime validator
-it only help us code and wire different files correctly during dev
-it does not validate requests like the Laravel Request does in runtime/production
-it's why I install zod (a TS firnedly plug-and-play validator) to mimic the actual Laravel style


Differece betwee _req and req:
-Use '_req: Request' when you dont need to validate the request payload but TS requires it (like a placeholder only) - For example: Use it in GET routes since we dont do anything with the request payload in GET routes.

-Use the 'req: CustomRequestType' when you need to validate the request payload:
    --Request payload consist of obects keyed by ReqParams, ReqBody, ReqQuery (req.params req.body, req.query)
    --In ts request validator, we have 4, including the ResBody but we dont actually need to validate it (overengineering)
    --( ReqParams, ResBody, ReqBody, ReqQuery ) maps to < {}, {}, {}, {} > 
    --You can validate from Request file or direct it to the controller if validator is simple only like the delete controller: export const deleteField = async (req: Request<{ id: string }>, res: Response)
    --ts Request validator is only aid for coding, foresee compile errors and autocompletion
    --ts Request validator is NOT a must, you can bypass it by using the type any, but the Zod runtime validator is a must (i guess? but we trust our code since we are only the devs so you can also not prioritize it)


Controller vs Service convention
-Controller
    --will only parse the req (body, params, query) and call the service
    --packaging of response go here. Response shape: {success, message, error, errorCode, data, pagination (in the future)}
    --always user try/catch to catch the 500 or unhandled server error
    --handled errors by the service are also catch here via their error code
    --use convention of [{filename}Controller] {Action} failed: {error details}. For example: [FieldController] Error deleting field:", error

-Service:
    --all logic go here (heavy logic)
    --can call other services as well
    --handle errors by throwing a custom error code and console logging the error details
    --to keep it clean, you dont need a try/catch block, unhandled error (500) will be already catched by the contorller
    --only use a try/catch if you plan to intercept a specific error condition and transform it. For example: I want to handle P2003 (invalid foreign key) error by prisma because i just want to throw a good error message in the frontend so i can inspect it in development
    --also, use a try/catch if necessary like calling a third-party api, other crucial services, etc.
    --use convention of [{filename}Service] {Action} failed: {error details}. For example: [FieldService] Creation failed: Invalid foreign key reference for field "${data.key}"


Seeders
-One entry point seed.ts
-Seeder files are separate under the /seeder folder
-Use factories for generating random fct data for testing, put files under /factories


Commands:
-Running the seed entry point:      docker compose exec backend npx prisma db seed
-Migrating:                         docker compose exec backend npx prisma migrate dev --name ____
                                    docker compose exec backend npx prisma generate
                                    docker compose exec -d backend npx prisma studio --port 5555 --browser none
-Watching backend docker logs       docker compose exec logs -f backend 