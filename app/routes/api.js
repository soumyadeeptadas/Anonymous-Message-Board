/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;

module.exports = function (app) {
  
var mongoose =require('mongoose');
var shortid = require('shortid');
  
  var DB_URI=process.env.DB_URI;
  
  mongoose.connect(DB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
  
var Schema = mongoose.Schema;

  var threadSchema= new Schema({
    _id: String,
    board: String,
    text: String,
    created_on: Date, 
    bumped_on: Date,
    reported: Boolean, 
    delete_password: String,
    replies: [{
              _id: String,
              text: String,
              created_on: Date,
              delete_password: String,
              reported: Boolean
              }]
  });
  
  
  
var thread = mongoose.model('thread', threadSchema);
  
  app.route('/api/findBoard/')
  .get((req,res)=>{
    //console.log(req.query);
    thread.findOne({board: req.query.board},(err,foundThread)=>{
      if(err){res.json({error: err});}
      if(!foundThread){res.json({Empty: `Create one by posting a thread on board: ${req.query.board}`});}
      res.redirect(`/b/${req.query.board}/`);
    })
    
  });
  
  app.route('/api/findThread/')
  .get((req,res)=>{
    //console.log(req.query);
     thread.findOne({_id: req.query.thread_id},(err,foundThread)=>{
      if(err){res.json({error: err});}
      if(!foundThread){res.json({Empty: `Thread with id: ${req.query.thread_id} not found!`});}
       if(foundThread.board==req.query.board){
          res.redirect(`/b/${req.query.board}/${req.query.thread_id}`);
       }else{res.json({Mismatch: `Thread with id: ${req.query.thread_id} not in board: ${req.query.board}. Check with board: ${foundThread.board}`});}
      
    })
  
  });
  
  
  app.route('/api/threads/:board')
  .get((req,res)=>{
    
    //console.log(req.params.board);
    thread.find({board: req.params.board}, '_id board text created_on bumped_on reported replies', (err,foundThreads)=>{
      //console.log(foundThreads);
     foundThreads.sort(function (a, b) {
  return b.bumped_on - a.bumped_on;
});
      
      
      //foundThreads=foundThreads.slice(0,10);
      //console.log(foundThreads);
     res.send(foundThreads);
      //res.json(foundThreads);
    });
  })
  .post((req,res)=>{
   // console.log(req.params.board, req.body);
    var newThread= new thread({
      _id: shortid.generate(),
      board: req.params.board,
      text: req.body.text,
      created_on: new Date(), 
      bumped_on: new Date(),
      reported: false, 
      delete_password: req.body.delete_password,
      //replies:
    });
    
    newThread.save((err)=>{
      if (err){res.json({error: err});}
      
     res.redirect(`/b/${req.params.board}/`);
    })
    
  })
  .delete((req,res)=>{
    //console.log(req.body);
    
    //console.log(req.params.board);
    thread.findOne({_id: req.body.thread_id}, (err,threadToDelete)=>{
      if(!threadToDelete){res.send(`No such thread with id: ${req.body.thread_id} present`);}
      else if(threadToDelete.board!=req.params.board){res.send(`No thread with id: ${req.body.thread_id}, in board: ${req.params.board}. Check in board: ${threadToDelete.board}`);}
      else if(threadToDelete.delete_password==req.body.delete_password){
        threadToDelete.remove();
        res.send(`Thread with id: ${req.body.thread_id} deleted! Please refresh the page.`);
      }
      else{
        res.send(`Incorrect Password for thread deletion`);
      }
    })
    
  })
  .put((req,res)=>{
      //console.log(req.body.report_id);
    //console.log(req.params.body);
    thread.findOne({_id: req.body.report_id}, (err,reportedThread)=>{
      if(err){res.send(err);}
      if(!reportedThread){res.send(`Thread with id: ${req.body.report_id} not found!`);}
      reportedThread.reported=true;
      reportedThread.bumped_on=new Date();
      reportedThread.save((err)=>{
        if(err){res.send(err);}
        //console.log(reportedThread);
        res.send(`Thread with id: ${req.body.report_id} has been reported.`);
      })
    })
  });
    
  app.route('/api/replies/:board')
  .get((req,res)=>{
    //console.log(req.params.board);
    //console.log(req.query.thread_id);
    thread.findOne({_id: req.query.thread_id},'_id board text created_on bumped_on reported replies', function(err, doc){
      if(err){res.json({error: err});}
      if(!doc){res.json({Error: `Thread with id: ${req.query.thread_id} on board: ${req.params.board}, not found`});}
      if (doc){
        if(doc.board!=req.params.board){res.json({Error: `No thread with id: ${doc._id}, on board: ${req.params.board}`});}
        //console.log(doc);  
        res.send(doc);
      }
    })
    
  })
  .post((req,res)=>{
    console.log(req.body);
    
    console.log(req.params);
    thread.findOne({ _id: req.body.thread_id}, function (err, doc){
  if(err){res.json({error: err});}
      if(!doc){res.json({Error: `Thread with id: ${req.body.thread_id} on board: ${req.params.board} not found`});}
      if(doc){
        let newReply={
           _id: shortid.generate(),
          text: req.body.text,
          created_on: new Date(),
          delete_password: req.body.delete_password,
          reported: false
        };
        doc.replies.push(newReply);
        doc.bumped_on= new Date();
        //console.log(doc);
        doc.save(function (err) {
        if(err) {res.json({error: err});}
          res.redirect(`/b/${req.params.board}/${req.body.thread_id}`);
    });
        
      }
});
    
  })
  .delete((req,res)=>{
    //console.log(req.body);
    thread.findOne({_id: req.body.thread_id}, (err,toDelete)=>{
      if(err){res.send(err);}
      if(!toDelete){res.send(`No such thread with id: ${req.body.thread_id} present`);}
      if(toDelete.board!=req.params.board){res.send(`No thread with id: ${req.body.thread_id}, in board: ${req.params.board}. Check in board: ${toDelete.board}`);}
      else{
        if(toDelete.replies.length==0){res.send(`No replies to delete`);}
        //console.log(toDelete);
        //var flag=true;
        console.log(req.body);
         for(let i=0;i<toDelete.replies.length;i++){
           if(toDelete.replies[i]._id==req.body.reply_id){
             
             toDelete.replies[i].text="[deleted]";
             toDelete.save((err)=>{
               if(err){res.send(err);}
               //flag=false;
               res.send(`Reply with id: ${req.body.reply_id} deleted! Please refresh the page.`)
             })
           }
           //console.log(toDelete.replies[i]);
         }
        //if(flag){res.send(`No reply with id: ${req.body.reply_id} found in this thread!`)}
       //toDelete.replies.findOne({_id: req})
      
      }
     
    })
    
  })
  .put((req,res)=>{
    console.log(req.body);
    thread.findOne({_id: req.body.thread_id},(err, theThread)=>{
      if(err){res.send(err);}
      if(!theThread){res.send(`No thread found with id: ${req.body.thread_id}`);}
      var flag=false;
      for(let i=0;i<theThread.replies.length;i++){
        if(theThread.replies[i]._id==req.body.reply_id){
          theThread.replies[i].reported=true;
          theThread.save((err)=>{
            if(err){res.send(err);}
            flag=true;
            res.send(`Reply with id: ${req.body.reply_id} has been reported.`);
          })
        }
      }
      if(flag){res.send(`No reply with id: ${req.body.reply_id} found in this thread!`);}
    })
  });

};
