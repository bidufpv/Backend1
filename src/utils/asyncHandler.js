const asyncHandler = (requestHandler)=>{
    return (req, res, next)=>{
        Promise.resolve(requestHandler(req, res, next))
        .catch((err)=>next(err))
    }
}
export  {asyncHandler};

// Wrapper: asyncHandler takes an async function fn as its argument.
// Promise Resolution: It executes fn(req, res, next) and wraps it in 
//Promise.resolve().
// Error Handling: If fn throws an error or rejects, .catch(next) will catch it and
// pass it to Express’s next error-handling middleware.























































// const asyncHandler = ()=>{}
// const asyncHandler = (func)=>()=>{}
// const asyncHandler = (func)=>async()=>{}
// const asyncHandler = (fn)=> async(req, res, next)=>{
//   try {
//     await fn(req, res, next)
//   } catch (error) {
//     res.status(err.code || 500).json({
//         success: false,
//         message: error.message
//     })
//   }
// }



