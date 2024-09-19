import multer from "multer";
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp')
    },
    filename: function(req, file, cb){
        cb(null, file.originalname)
        console.log(file);
    }});
export const uploadMulter = multer({
    storage,
    limits: {fileSize: 10*1024*1024},
    filefilter: function(req, file, cb){
        const fileTypes = /jpeg|jpg|png|gif|pdf/;
        const mimetype = fileTypes.test(file.mimetype);
        const extensionNames = fileTypes.test(path.extensionNames(file.originalname).tolowercase());
        //original name is provided my multer and path comes from nodejs

        if(mimetype && extensionNames){
            return cb(null, true)
        }else{
            cb(new Error('Error in uploading file. Filetypes supported are' + fileTypes))
        }
    }
});