const Scheduleworkertime = require('../models/scheduleworkertime');
const Scheduledefault = require('../models/scheduledefault');
const Scheduleworkertimeweek = require('../models/scheduleworkertimeweek');
const Scheduleworkerstartstoplog = require('../models/scheduleworkerstartstoplog');
const Checklist = require('../models/checklist');
const SOPs = require('../models/SOPs-model');
const Users = require('../models/users-model');
require('datejs')
var mongoose = require('mongoose');
var socketapp = require('../../socketapp.js');
var moment = require('moment');

exports.schedule_worker_time = (req, res, next) => {
  async function scheduleWorkerTimeInsAsync(req, res, next) {
   var response = await scheduleWorkerTimeIns(req, res, next);

    if(response){

        var res_return = {};
        res_return['success'] = 1;
        res_return['data'] = null;
        res.json(res_return);

    }

  }
  console.log('request ',req.body);
  socketapp.scheduleListOnSocket(req.body.worker_id,'All_Days_Total',req.body.work_week,req.body.work_year);
  scheduleWorkerTimeInsAsync(req, res, next);

}



function scheduleWorkerTimeIns(req, res, next){

    return new Promise(function(resolve, reject) {  

      var worker_id          = req.body.worker_id;
      var day_name           = req.body.day_name;
      var work_week          = req.body.work_week;
      var work_year          = req.body.work_year;

      /*Check if record is already does existing*/  

      var 
      whereArrayRE = {}
      whereArrayRE['worker_id'] = mongoose.Types.ObjectId(worker_id);
      whereArrayRE['day_name']  = day_name;
      whereArrayRE['work_week'] = work_week;
      whereArrayRE['work_year'] = work_year;

      Scheduleworkertime.findOne(whereArrayRE, function(err4, schedule_does_exist){

        if(!schedule_does_exist){

              if(req.body.sch_start_time==0){
                var sch_start_time   = 0;  
              } else {
                var sch_start_time   = req.body.sch_start_time;  
              }
              
              if(req.body.sch_end_time==0){
                var sch_end_time   = 0;  
              } else {
                var sch_end_time   = req.body.sch_end_time;  
              }
            
              var created_by         = req.body.adminId;
              var companyObjectId    = req.body.companyId;


              var start_time_24Hrs = (new Date).clearTime().addSeconds(sch_start_time).toString('HH:mm');
              var end_time_24Hrs   = (new Date).clearTime().addSeconds(sch_end_time).toString('HH:mm');
              var start_time_12Hrs = (new Date).clearTime().addSeconds(sch_start_time).toString('hh:mm tt');
              var end_time_12Hrs   = (new Date).clearTime().addSeconds(sch_end_time).toString('hh:mm tt');
              var total_sch_seconds= (sch_end_time - sch_start_time);
              var total_sch_hours  = (new Date).clearTime().addSeconds(total_sch_seconds).toString('HH:mm')


              var schedule_time_array = {

                  start_time_seconds:sch_start_time,
                  end_time_seconds:sch_end_time,
                  start_time_24Hrs:start_time_24Hrs,
                  end_time_24Hrs:end_time_24Hrs,
                  start_time_12Hrs:start_time_12Hrs,
                  end_time_12Hrs:end_time_12Hrs,
                  total_sch_hours:total_sch_hours
              };

              var reported_time_array = {

                  start_time_seconds:0,
                  end_time_seconds:0,
                  start_time_24Hrs:'00:00',
                  end_time_24Hrs:'00:00',
                  start_time_12Hrs:'00:00',
                  end_time_12Hrs:'00:00',
                  total_rptd_hours:'00:00'
              };

              var worked_time_array = {

                  start_time_seconds:0,
                  end_time_seconds:0,
                  start_time_24Hrs:'00:00',
                  end_time_24Hrs:'00:00',
                  start_time_12Hrs:'00:00',
                  end_time_12Hrs:'00:00',
                  total_work_hours:'00:00'
              };

              var weekly_less_more_hours = {
                  total_hours:'00:00',
                  total_hours_notes:0
              };
              
              var work_date = moment().day(day_name).year(work_year).week(work_week).toDate()

              const scheduleworkertime = new Scheduleworkertime({
                worker_id:worker_id,
                day_name:day_name,
                work_week:work_week,
                work_year: work_year,
                work_date: work_date,
                schedule_time_array:schedule_time_array,
                reported_time_array:reported_time_array,
                worked_time_array:worked_time_array,
                weekly_less_more_hours:weekly_less_more_hours,
                companyObjectId:companyObjectId,
                created_by:created_by
              });
                scheduleworkertime.save().then(createdObject => {
                
                /*Manage Week total here with a seprate entery*/  
                
                var whereArray = {}
                whereArray['worker_id'] = mongoose.Types.ObjectId(req.body.worker_id);
                whereArray['day_name']  = 'All_Days_Total';
                whereArray['work_week'] = req.body.work_week;
                whereArray['work_year'] = req.body.work_year;

                Scheduleworkertime.findOne(whereArray, function(err4, scheduleworkertime){


                    if(scheduleworkertime){

                      async function getSyncAllDayTotalAsync(req, res, scheduleworkertime, whereArray) {

                        var response = await getSyncAllDayTotal(req, res, scheduleworkertime, whereArray);

                        if(response){
                          var res_return = {};
                          res_return['success'] = 1;
                          res_return['data'] = null;
                          resolve(res_return);
                        }
  
                      }


                      getSyncAllDayTotalAsync(req, res, scheduleworkertime, whereArray);


                    } else {

                      var schedule_time_array_2 = {

                        start_time_seconds:sch_start_time,
                        end_time_seconds:sch_end_time,
                        total_sch_hours:total_sch_hours

                      };

                      var reported_time_array_2 = {
                          start_time_seconds:0,
                          end_time_seconds:0,
                          total_rptd_hours:'00:00'
                      };

                      var worked_time_array_2 = {
                          start_time_seconds:0,
                          end_time_seconds:0,
                          total_work_hours:'00:00'
                      };

                      var weekly_less_more_hours_2 = {
                          total_hours:'00:00',
                          total_hours_notes:0
                      };

                    const scheduleworkertime = new Scheduleworkertime({
                          worker_id:worker_id,
                          day_name:'All_Days_Total',
                          work_week:work_week,
                          work_year: work_year,
                          schedule_time_array:schedule_time_array_2,
                          reported_time_array:reported_time_array_2,
                          worked_time_array:worked_time_array_2,
                          weekly_less_more_hours:weekly_less_more_hours_2,
                          companyObjectId:companyObjectId,
                          created_by:created_by
                        });
                        scheduleworkertime.save().then(createdObject => {

                        
                        /*var 
                        whereArrayWeek={};
                        whereArrayWeek['work_week'] = work_week;
                        whereArrayWeek['work_year'] = work_year;
                        whereArrayWeek['companyObjectId'] =  req.body.companyId;

                        Scheduleworkertimeweek.findOne(whereArrayWeek, function(err4, scheduleworkertimeweek_result){

                            if(!scheduleworkertimeweek_result){*/

                              console.log('Week added');
                              const scheduleworkertimeweek = new Scheduleworkertimeweek({
                                worker_id:worker_id,
                                work_week:work_week,
                                work_year: work_year,
                                companyObjectId:companyObjectId,
                                created_by:created_by
                              });

                              scheduleworkertimeweek.save().then(createdObject => {


                                var res_return = {};
                                res_return['success'] = 1;
                                res_return['data'] = null;
                                resolve(res_return);

                              }) 

                            /*} else {
                                console.log('Week already there');
                                var res_return = {};
                                res_return['success'] = 1;
                                res_return['data'] = null;
                                resolve(res_return);

                            }

                        }) */ 
                          
                        }).catch(error => {
                        });

                    }

            })

        })
       
       } else {

        var res_return = {};
        res_return['success'] = 0;
        res_return['data'] = null;
        resolve(res_return);

       }
                
      })/*Records does exist*/          

    })          
}


exports.copy_schedule_worker_time_to_next_week = (req, res, next) => {


      var current_year = ""+req.body.current_year+"";
      var current_week = ""+req.body.current_week+"";

      var dateObj = new Date();

      var total_week_in_year = Math.max(
        moment(new Date(current_year, 11, 31)).isoWeek()
      , moment(new Date(current_year, 11, 31-7)).isoWeek()
      );

      if(parseInt(req.body.current_week) < parseInt(total_week_in_year)){
        var copy_to_year   = req.body.current_year;
        var copy_to_week   = parseInt(req.body.current_week)+1;
      } else {
        var copy_to_year   = parseInt(req.body.current_year)+1;
        var copy_to_week   = 1;
      }


      Scheduleworkertime.aggregate([
      {
        $match: {
            companyObjectId: mongoose.Types.ObjectId(req.body.companyId),
            work_year : current_year,
            work_week : current_week
        }
      },
      ]).exec(function (err, query_result) {

          

          function asyncloop(loop,query_result,callback){  

            if(loop < query_result.length){
                
            async function scheduleWorkerTimeInsAsync(req, res, next, query_result) {
              
              req.body.worker_id       = query_result[loop].worker_id;
              req.body.day_name        = query_result[loop].day_name;
              req.body.work_week       = copy_to_week;
              req.body.work_year       = copy_to_year;
              req.body.sch_start_time  = query_result[loop].schedule_time_array['0'].start_time_seconds;
              req.body.sch_end_time    = query_result[loop].schedule_time_array['0'].end_time_seconds;
              req.body.created_by      = query_result[loop].created_at;
              req.body.companyId = query_result[loop].companyObjectId;
              
              var response = await scheduleWorkerTimeIns(req, res, next);
              if(response){
                asyncloop(loop+1,query_result,callback); 
              }

            }

            scheduleWorkerTimeInsAsync(req, res, next, query_result);  

            } else {

              callback();
            
            }

          }


          asyncloop(0,query_result,function(){
           

          /*Save here for default table*/
            var 
            whereArrayDs = {};
            whereArrayDs['work_week'] = current_week;
            whereArrayDs['work_year'] = current_year;
            whereArrayDs['companyObjectId'] = mongoose.Types.ObjectId(req.body.companyId);
            whereArrayDs['day_name']  = {$ne:'All_Days_Total'};

            Scheduledefault.find(whereArrayDs, function(err4, scheduledefault){
               
              function asyncloopInner(loopInner,scheduledefault,callback){  

                if(loopInner < scheduledefault.length){
                    
                async function scheduleDefaultInsAsync(req, res, next, scheduledefault) {
                  

                  req.body.day_name        = scheduledefault[loopInner].day_name;
                  req.body.work_week       = copy_to_week;
                  req.body.work_year       = copy_to_year;
                  req.body.def_sch_start_time = scheduledefault[loopInner].schedule_time_array['0'].start_time_seconds;
                  req.body.def_sch_end_time   = scheduledefault[loopInner].schedule_time_array['0'].end_time_seconds;
                  req.body.created_by      = scheduledefault[loopInner].adminId;
                  req.body.companyObjectId = scheduledefault[loopInner].companyObjectId;
                  
                  var response = await scheduleDefaultIns(req, res, next);
                  
                  if(response){
                    asyncloopInner(loopInner+1,scheduledefault,callback); 
                  }

                }

                scheduleDefaultInsAsync(req, res, next, scheduledefault);  

                } else {

                  callback();
                
                }

              }


              asyncloopInner(0,scheduledefault,function(){
      
                var res_return = {};  
                res_return['success'] = 1;
                res_return['data'] = 1
                return res.json(res_return);


              })


            })                                  
          /*Save here for default table*/
             
          })


      })

}


function getSyncAllDayTotal(req, res, scheduleworkertime, whereArrayValues){

    return new Promise(function(resolve, reject) {  

    var 
    whereArray = {}
    whereArray['worker_id'] = whereArrayValues.worker_id;
    whereArray['day_name']  = {$ne:'All_Days_Total'};
    whereArray['work_week'] = whereArrayValues.work_week;
    whereArray['work_year'] = whereArrayValues.work_year;
     
    Scheduleworkertime.find(whereArray, function(err4, scheduleworkertime){


        var total_start_time_seconds=0;
        var total_end_time_seconds=0;

        function asyncloop(loop,scheduleworkertime,callback){  
          if(loop <scheduleworkertime.length){


            total_start_time_seconds = parseInt(total_start_time_seconds) + parseInt(scheduleworkertime[loop].schedule_time_array['0'].start_time_seconds);
            total_end_time_seconds   = parseInt(total_end_time_seconds) + parseInt(scheduleworkertime[loop].schedule_time_array['0'].end_time_seconds);

            asyncloop(loop+1,scheduleworkertime,callback); 

          } else {

            callback();

          }
        }

        asyncloop(0,scheduleworkertime,function(){

          
            var start_time_24Hrs = (new Date).clearTime().addSeconds(total_start_time_seconds).toString('HH:mm');
            var end_time_24Hrs   = (new Date).clearTime().addSeconds(total_end_time_seconds).toString('HH:mm');
            var start_time_12Hrs = (new Date).clearTime().addSeconds(total_start_time_seconds).toString('hh:mm tt');
            var end_time_12Hrs   = (new Date).clearTime().addSeconds(total_end_time_seconds).toString('hh:mm tt');
            var total_sch_seconds= (total_end_time_seconds - total_start_time_seconds);
            //var total_sch_hours  = (new Date).clearTime().addSeconds(total_sch_seconds).toString('HH:mm')
            //var total_sch_hours  = Math.floor(total_sch_seconds / 3600);

            /*Calculate total hours*/
            let totalSeconds = total_sch_seconds;
            let hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            let minutes = Math.floor(totalSeconds / 60);
            let seconds = totalSeconds % 60;
            minutes = String(minutes).padStart(2, "0");
            hours = String(hours).padStart(2, "0");
            seconds = String(seconds).padStart(2, "0");
            var total_sch_hours = hours + ":" + minutes;



            var schedule_time_array = {

                start_time_seconds:total_start_time_seconds,
                end_time_seconds:total_end_time_seconds,
                total_sch_hours:total_sch_hours
            };

        
            updatedataWhere = {};
            updatedataWhere['worker_id'] = whereArrayValues.worker_id;
            updatedataWhere['day_name']  = 'All_Days_Total';
            updatedataWhere['work_week'] = whereArrayValues.work_week;
            updatedataWhere['work_year'] = whereArrayValues.work_year;
    
            Scheduleworkertime.findOneAndUpdate(updatedataWhere, 
              {schedule_time_array:schedule_time_array}, {new:true}, 
              function(err4, data){
  
                if (err4) {
                  console.log(err4);
                } 

                var res_return = {};
                res_return['success'] = 1;
                res_return['data'] = null;
                resolve(res_return);
          });

        })

    })

  })
}




function getSyncAllReportedDayTotal(req, res, schedule_worker_time){

    return new Promise(function(resolve, reject) {  
      
      var 
      whereArray = {}
      whereArray['worker_id'] = schedule_worker_time.worker_id;
      whereArray['day_name']  = {$ne:'All_Days_Total'};
      whereArray['work_week'] = schedule_worker_time.work_week;
      whereArray['work_year'] = schedule_worker_time.work_year;
       
      Scheduleworkertime.find(whereArray, function(err4, scheduleworkertime){


          var total_start_time_seconds=0;
          var total_end_time_seconds=0;
          var total_worked_start_time_seconds=0;
          var total_worked_end_time_seconds=0;

          function asyncloop(loop,scheduleworkertime,callback){  
            
            if(loop <scheduleworkertime.length){

              /*Note down total day time*/
              total_start_time_seconds = parseInt(total_start_time_seconds) + parseInt(scheduleworkertime[loop].reported_time_array['0'].start_time_seconds);
              total_end_time_seconds   = parseInt(total_end_time_seconds) + parseInt(scheduleworkertime[loop].reported_time_array['0'].end_time_seconds);
              
              /*Note down total worked time*/
              total_worked_start_time_seconds = parseInt(total_worked_start_time_seconds) + parseInt(scheduleworkertime[loop].worked_time_array['0'].start_time_seconds);
              total_worked_end_time_seconds   = parseInt(total_worked_end_time_seconds) + parseInt(scheduleworkertime[loop].worked_time_array['0'].end_time_seconds);


              asyncloop(loop+1,scheduleworkertime,callback); 

            } else {

              callback();

            }
          }

          asyncloop(0,scheduleworkertime,function(){

              var total_rptd_seconds= (total_end_time_seconds - total_start_time_seconds);
              var total_work_seconds= (total_worked_end_time_seconds - total_worked_start_time_seconds);


              async function calculateTotalHoursAsync(total_rptd_seconds) {

                  /*Calculate reported hours and working hours here*/
                  var total_rptd_hours = await calculateTotalHours(total_rptd_seconds);
                  var total_work_hours = await calculateTotalHours(total_work_seconds);

                  var reported_time_array = {
                      start_time_seconds:total_start_time_seconds,
                      end_time_seconds:total_end_time_seconds,
                      total_rptd_hours:total_rptd_hours
                  };

                  var worked_time_array = {
                      start_time_seconds:total_worked_start_time_seconds,
                      end_time_seconds:total_worked_end_time_seconds,
                      total_work_hours:total_work_hours
                  };

                  var 
                  updatedataWhere = {};
                  updatedataWhere['worker_id'] = schedule_worker_time.worker_id;
                  updatedataWhere['day_name']  = 'All_Days_Total';
                  updatedataWhere['work_week'] = schedule_worker_time.work_week;
                  updatedataWhere['work_year'] = schedule_worker_time.work_year;


                  Scheduleworkertime.findOneAndUpdate(updatedataWhere,{
                      reported_time_array:reported_time_array,
                      worked_time_array:worked_time_array
                    }, {new:true}, 
                    function(err4, schdule_work_result){

                          /*Total + or - hours */
                          var sch_start_time_seconds   = schdule_work_result.schedule_time_array['0'].start_time_seconds;
                          var sch_end_time_seconds     = schdule_work_result.schedule_time_array['0'].end_time_seconds;
                          var sch_start_end_time_diff  = parseInt(sch_end_time_seconds) - parseInt(sch_start_time_seconds); 

                          var work_start_time_seconds  = schdule_work_result.worked_time_array['0'].start_time_seconds;
                          var work_end_time_seconds    = schdule_work_result.worked_time_array['0'].end_time_seconds;
                          var work_start_end_time_diff = parseInt(work_end_time_seconds) - parseInt(work_start_time_seconds); 

                        
                          if(sch_start_end_time_diff > work_start_end_time_diff){
                            var sch_work_time_diff  =  parseInt(sch_start_end_time_diff) - parseInt(work_start_end_time_diff);
                            var total_hours_notes =  'LESS_THAN_SCHEDULE';
                            var status_sign =  '-';
                          } else if(work_start_end_time_diff> sch_start_end_time_diff){
                            var sch_work_time_diff  =  parseInt(work_start_end_time_diff) - parseInt(sch_start_end_time_diff);
                            var total_hours_notes =  'MORE_THAN_SCHEDULE';
                            var status_sign =  '+';
                          } else {
                            var sch_work_time_diff =  parseInt(sch_start_end_time_diff) - parseInt(work_start_end_time_diff);
                            var total_hours_notes =  'EQUAL';
                            var status_sign =  '+/-';
                          }
                          /*Total + or - hours */



                          async function calculateTotalHoursAsync2(sch_work_time_diff) {
                             
                             var total_hours = await calculateTotalHours(sch_work_time_diff);
                             
                             var weekly_less_more_hours = {
                                  total_hours:total_hours,
                                  total_hours_notes:total_hours_notes,
                                  status_sign:status_sign
                              };

                              
                                Scheduleworkertime.findOneAndUpdate(updatedataWhere,{
                                weekly_less_more_hours:weekly_less_more_hours
                                }, {new:true}, 
                                function(err4, schdule_work_result){

                                    var res_return = {};
                                    res_return['success'] = 1;
                                    res_return['data'] = null;
                                    //console.log('------------------0')
                                    resolve(total_rptd_hours);

                                })

                          } 

                          calculateTotalHoursAsync2(sch_work_time_diff);

                  })                


              }

              calculateTotalHoursAsync(total_rptd_seconds);

          })

      })

  })
}







function calculateTotalHours(total_seconds){

    return new Promise(function(resolve, reject) {  
      
      let totalSeconds = total_seconds;
      let hours = Math.floor(totalSeconds / 3600);
      totalSeconds %= 3600;
      let minutes = Math.floor(totalSeconds / 60);
      let seconds = totalSeconds % 60;
      minutes = String(minutes).padStart(2, "0");
      hours = String(hours).padStart(2, "0");
      seconds = String(seconds).padStart(2, "0");
      total_rptd_hours = hours + ":" + minutes;
      
      resolve(total_rptd_hours);


   }) 
}




exports.schedule_worker_time_update_OLD = (req, res, next) => {

    var current_schedule_id= req.body.current_schedule_id;
    var worker_id          = req.body.worker_id;
    var day_name           = req.body.day_name;
    var work_week          = req.body.work_week;
    var work_year          = req.body.work_year;
    
    if(req.body.sch_start_time==0){
      var sch_start_time   = 0;  
    } else {
      var sch_start_time   = req.body.sch_start_time;  
    }
    
    if(req.body.sch_end_time==0){
      var sch_end_time   = 0;  
    } else {
      var sch_end_time   = req.body.sch_end_time;  
    }
  
    var created_by         = req.body.adminId;
    var companyObjectId    = req.body.companyId;


    var start_time_24Hrs = (new Date).clearTime().addSeconds(sch_start_time).toString('HH:mm');
    var end_time_24Hrs   = (new Date).clearTime().addSeconds(sch_end_time).toString('HH:mm');
    var start_time_12Hrs = (new Date).clearTime().addSeconds(sch_start_time).toString('hh:mm tt');
    var end_time_12Hrs   = (new Date).clearTime().addSeconds(sch_end_time).toString('hh:mm tt');
    var total_sch_seconds= (sch_end_time - sch_start_time);
    var total_sch_hours  = (new Date).clearTime().addSeconds(total_sch_seconds).toString('HH:mm')


    var schedule_time_array = {

        start_time_seconds:sch_start_time,
        end_time_seconds:sch_end_time,
        start_time_24Hrs:start_time_24Hrs,
        end_time_24Hrs:end_time_24Hrs,
        start_time_12Hrs:start_time_12Hrs,
        end_time_12Hrs:end_time_12Hrs,
        total_sch_hours:total_sch_hours
    };

    var 
    updatedataWhere = {};
    updatedataWhere['_id'] = current_schedule_id;

    var 
    updatedata = {};
    updatedata['schedule_time_array'] = schedule_time_array;


    Scheduleworkertime.findOneAndUpdate(updatedataWhere, updatedata, {new:true}, function(err4, data){
      if (err4) {
        console.log(err4);
      } 


      /*Here update total*/
      var whereArray = {}
      whereArray['worker_id'] = mongoose.Types.ObjectId(req.body.worker_id);
      whereArray['day_name']  = 'All_Days_Total';
      whereArray['work_week'] = req.body.work_week;
      whereArray['work_year'] = req.body.work_year;

          


          Scheduleworkertime.findOne(whereArray, function(err4, scheduleworkertime){

              async function getSyncAllDayTotalAsync(req, res, scheduleworkertime, whereArray) {

                var response = await getSyncAllDayTotal(req, res, scheduleworkertime, whereArray);
                var res_return = {};
                res_return['success'] = 1;
                res_return['data'] = null;
                return res.json(res_return);

              }

              getSyncAllDayTotalAsync(req, res, scheduleworkertime, whereArray);
          })





    });

}


exports.schedule_worker_time_update = (req, res, next) => {
console.log('CC');
    var current_schedule_logs_id = req.body.current_schedule_logs_id;
    var current_schedule_id= req.body.current_schedule_id;
    var rptd_ss_start_time = req.body.rptd_ss_start_time;
    var rptd_ss_end_time = req.body.rptd_ss_end_time;
    var schd_rptd = req.body.schd_rptd;


    switch(req.body.schd_rptd){

      case 'schd':
      
      var start_time_24Hrs = (new Date).clearTime().addSeconds(rptd_ss_start_time).toString('HH:mm');
      var end_time_24Hrs   = (new Date).clearTime().addSeconds(rptd_ss_end_time).toString('HH:mm');
      var start_time_12Hrs = (new Date).clearTime().addSeconds(rptd_ss_start_time).toString('hh:mm tt');
      var end_time_12Hrs   = (new Date).clearTime().addSeconds(rptd_ss_end_time).toString('hh:mm tt');
      var total_sch_seconds= (rptd_ss_end_time - rptd_ss_start_time);
      var total_sch_hours  = (new Date).clearTime().addSeconds(total_sch_seconds).toString('HH:mm')

      var schedule_time_array = {

          start_time_seconds:rptd_ss_start_time,
          end_time_seconds:rptd_ss_end_time,
          start_time_24Hrs:start_time_24Hrs,
          end_time_24Hrs:end_time_24Hrs,
          start_time_12Hrs:start_time_12Hrs,
          end_time_12Hrs:end_time_12Hrs,
          total_sch_hours:total_sch_hours
      };

      var 
      updatedataWhere = {};
      updatedataWhere['_id'] = current_schedule_id;

      var 
      updatedata = {};
      updatedata['schedule_time_array'] = schedule_time_array;

      Scheduleworkertime.findOneAndUpdate(updatedataWhere, updatedata, {new:true}, function(err4, scheduleworkertime){

        /*Here update total*/
        var whereArray = {}
        whereArray['worker_id'] = mongoose.Types.ObjectId(scheduleworkertime.worker_id);
        whereArray['day_name']  = 'All_Days_Total';
        whereArray['work_week'] = scheduleworkertime.work_week;
        whereArray['work_year'] = scheduleworkertime.work_year;


          async function getSyncAllDayTotalAsync(req, res, scheduleworkertime, whereArray) {

            var response = await getSyncAllDayTotal(req, res, scheduleworkertime, whereArray);
            
            console.log(JSON.stringify(response));

            if(response){
                
                async function getSyncAllReportedDayTotalAsync(req, res, scheduleworkertime) {

                  var response = await getSyncAllReportedDayTotal(req, res, scheduleworkertime);
                  var res_return = {};
                  res_return['success'] = 1;
                  res_return['data'] = null;
                  return res.json(res_return);

                }

                getSyncAllReportedDayTotalAsync(req, res, scheduleworkertime);
            }

          }

          getSyncAllDayTotalAsync(req, res, scheduleworkertime, whereArray);

      })
      
      break;


    
      case 'rptd':

        Scheduleworkertime.findOne({
          _id:mongoose.Types.ObjectId(current_schedule_id)
        }, function(err4, scheduleworkertime){

            var sch_start_time  = scheduleworkertime.reported_time_array['0'].start_time_seconds;  

            if(rptd_ss_end_time){
              var sch_end_time  = rptd_ss_end_time;  
            } else {
              var sch_end_time  = scheduleworkertime.reported_time_array['0'].end_time_seconds; 
            }


            if(sch_end_time > sch_start_time){
              var start_time_24Hrs  = (new Date).clearTime().addSeconds(sch_start_time).toString('HH:mm');
              var end_time_24Hrs    = (new Date).clearTime().addSeconds(sch_end_time).toString('HH:mm');
              var start_time_12Hrs  = (new Date).clearTime().addSeconds(sch_start_time).toString('hh:mm tt');
              var end_time_12Hrs    = (new Date).clearTime().addSeconds(sch_end_time).toString('hh:mm tt');
              var total_sch_seconds = (sch_end_time - sch_start_time);
              var total_rptd_hours  = (new Date).clearTime().addSeconds(total_sch_seconds).toString('HH:mm');
            }

            var reported_time_array = {
                start_time_seconds:sch_start_time,
                end_time_seconds:sch_end_time,
                start_time_24Hrs:start_time_24Hrs,
                end_time_24Hrs:end_time_24Hrs,
                start_time_12Hrs:start_time_12Hrs,
                end_time_12Hrs:end_time_12Hrs,
                total_rptd_hours:total_rptd_hours,
            };


            Scheduleworkertime.findOneAndUpdate(
            {_id:mongoose.Types.ObjectId(current_schedule_id)}, 
            {reported_time_array:reported_time_array}, {new:true}, 
            function(err4, scheduleworkertime_upd){

            
                var start_time_24Hrs_log  = (new Date).clearTime().addSeconds(rptd_ss_start_time).toString('HH:mm');
                var end_time_24Hrs_log    = (new Date).clearTime().addSeconds(rptd_ss_end_time).toString('HH:mm');
                var start_time_12Hrs_log  = (new Date).clearTime().addSeconds(rptd_ss_start_time).toString('hh:mm tt');
                var end_time_12Hrs_log    = (new Date).clearTime().addSeconds(rptd_ss_end_time).toString('hh:mm tt');

                var 
                updatedata = {};
                updatedata['start_time_seconds'] = rptd_ss_start_time;
                updatedata['end_time_seconds'] = rptd_ss_end_time;
                updatedata['start_time_24Hrs'] = start_time_24Hrs_log;
                updatedata['end_time_24Hrs']   = end_time_24Hrs_log;
                updatedata['start_time_12Hrs'] = start_time_12Hrs_log;
                updatedata['end_time_12Hrs']   = end_time_12Hrs_log;

                var 
                updatedataWhere = {};
                updatedataWhere['_id'] = current_schedule_logs_id;              

                      Scheduleworkerstartstoplog.findOneAndUpdate(updatedataWhere, updatedata, {new:true}, function(err4, data){
                     
                          /*This logic will calculate complete hours*/
                          var 
                          updatedataSWTWhere = {};
                          updatedataSWTWhere['_id'] = mongoose.Types.ObjectId(current_schedule_id);

                              Scheduleworkertime.findOne(updatedataSWTWhere, function(err4, scheduleworkertime){

                                async function workerWorkingHoursAsync(req, res, scheduleworkertime) {

                                var response = await workerWorkingHours(req, res, scheduleworkertime);

                                    var res_return = {};
                                    res_return['success'] = 1;
                                    res_return['data'] = null;
                                    return res.json(res_return);

                                }
                                
                                workerWorkingHoursAsync(req, res, scheduleworkertime);

                              })
                          /*This logic will calculate complete hours*/

                      });

            })

      })      

      break;
    }
      
}


exports.schedule_default = (req, res, next) => {

  async function scheduleDefaultInsAsync(req, res, next) {

   var response = await scheduleDefaultIns(req, res, next);

    if(response){

        var res_return = {};
        res_return['success'] = 1;
        res_return['data'] = null;
        res.json(res_return);

    }

  }
  
  scheduleDefaultInsAsync(req, res, next);


}


function scheduleDefaultIns(req, res, next){

   return new Promise(function(resolve, reject) {  


    var day_name           = req.body.day_name;
    var work_week          = req.body.work_week;
    var work_year          = req.body.work_year;
    var def_sch_start_time = req.body.def_sch_start_time;
    var def_sch_end_time   = req.body.def_sch_end_time;  
    var created_by         = req.body.adminId;
    var companyObjectId    = req.body.companyId;
    var current_def_sch_id = req.body.current_def_sch_id;
    var work_date          = moment().day(day_name).year(work_year).week(work_week).toDate();


    var start_time_24Hrs = (new Date).clearTime().addSeconds(def_sch_start_time).toString('HH:mm');
    var end_time_24Hrs   = (new Date).clearTime().addSeconds(def_sch_end_time).toString('HH:mm');
    var start_time_12Hrs = (new Date).clearTime().addSeconds(def_sch_start_time).toString('hh:mm tt');
    var end_time_12Hrs   = (new Date).clearTime().addSeconds(def_sch_end_time).toString('hh:mm tt');
    var total_sch_seconds= (def_sch_end_time - def_sch_start_time);
    var total_sch_hours  = (new Date).clearTime().addSeconds(total_sch_seconds).toString('HH:mm')

    var schedule_time_array = {

        start_time_seconds:def_sch_start_time,
        end_time_seconds:def_sch_end_time,
        start_time_24Hrs:start_time_24Hrs,
        end_time_24Hrs:end_time_24Hrs,
        start_time_12Hrs:start_time_12Hrs,
        end_time_12Hrs:end_time_12Hrs,
        total_sch_hours:total_sch_hours
    }; 









    if(current_def_sch_id){

        Scheduledefault.findOneAndUpdate(
        {_id:mongoose.Types.ObjectId(current_def_sch_id)}, 
        {schedule_time_array:schedule_time_array}, {new:true}, 
        function(err4, scheduledefault){
        

          async function getSyncSchDefAllDayTotalAsync(req, res, scheduledefault) {

            var response = await getSyncSchDefAllDayTotal(req, res, scheduledefault);
            var res_return = {};
            res_return['success'] = 1;
            res_return['data'] = null;
            resolve(res_return);

          }

          getSyncSchDefAllDayTotalAsync(req, res, scheduledefault);


        })

    }  else {

      var 
      whereArrayExist ={};
      whereArrayExist['day_name'] = day_name;
      whereArrayExist['work_week'] = work_week;
      whereArrayExist['work_year'] = work_year;
      whereArrayExist['companyObjectId'] = companyObjectId;
      Scheduledefault.findOne(whereArrayExist, function(err4, is_record_exist){

        if(!is_record_exist){

          const scheduledefault = new Scheduledefault({
            day_name:day_name,
            work_date: work_date,
            work_week:work_week,
            work_year: work_year,
            schedule_time_array:schedule_time_array,
            companyObjectId:companyObjectId,
            created_by:created_by
          });

          scheduledefault.save().then(createdObject => {


              var whereArray = {}
              whereArray['day_name']  = 'All_Days_Total';
              whereArray['work_week'] = req.body.work_week;
              whereArray['work_year'] = req.body.work_year;
              whereArray['companyObjectId'] = req.body.companyId;

                Scheduledefault.findOne(whereArray, function(err4, scheduledefault){

                    if(scheduledefault){

                          async function getSyncSchDefAllDayTotalAsync(req, res, scheduledefault) {

                            var response = await getSyncSchDefAllDayTotal(req, res, scheduledefault);
                            var res_return = {};
                            res_return['success'] = 1;
                            res_return['data'] = null;
                            resolve(res_return);

                          }
                            
                         getSyncSchDefAllDayTotalAsync(req, res, scheduledefault);

                    } else {

                        const scheduledefault = new Scheduledefault({
                          day_name:'All_Days_Total',
                          work_week:work_week,
                          work_year: work_year,
                          schedule_time_array:schedule_time_array,
                          companyObjectId:companyObjectId,
                          created_by:created_by
                        });

                        scheduledefault.save().then(createdObject => {
                  
                            /*Return response here*/
                              var res_return = {};
                              res_return['success'] = 1;
                              res_return['data'] = null;
                              resolve(res_return);

                        })

                    }
                })
          })

        } else {

        /*Return response here*/
          var res_return = {};
          res_return['success'] = 1;
          res_return['data'] = null;
          resolve(res_return);

        }

      })

    }












  })
}



function getSyncSchDefAllDayTotal(req, res, scheduleworkertime){

    return new Promise(function(resolve, reject) {  

    var 
    whereArray = {}
    whereArray['day_name']    = {$ne:'All_Days_Total'};
    whereArray['work_week']   = scheduleworkertime.work_week;
    whereArray['work_year']   = scheduleworkertime.work_year;
    whereArray['companyObjectId'] = scheduleworkertime.companyObjectId;
    
    Scheduledefault.find(whereArray, function(err4, scheduledefault){


        var total_start_time_seconds=0;
        var total_end_time_seconds=0;

        function asyncloop(loop,scheduledefault,callback){  
          if(loop <scheduledefault.length){


            total_start_time_seconds = parseInt(total_start_time_seconds) + parseInt(scheduledefault[loop].schedule_time_array['0'].start_time_seconds);
            total_end_time_seconds   = parseInt(total_end_time_seconds) + parseInt(scheduledefault[loop].schedule_time_array['0'].end_time_seconds);

            asyncloop(loop+1,scheduledefault,callback); 

          } else {

            callback();

          }
        }

        asyncloop(0,scheduledefault,function(){

            var start_time_24Hrs = (new Date).clearTime().addSeconds(total_start_time_seconds).toString('HH:mm');
            var end_time_24Hrs   = (new Date).clearTime().addSeconds(total_end_time_seconds).toString('HH:mm');
            var start_time_12Hrs = (new Date).clearTime().addSeconds(total_start_time_seconds).toString('hh:mm tt');
            var end_time_12Hrs   = (new Date).clearTime().addSeconds(total_end_time_seconds).toString('hh:mm tt');
            var total_sch_seconds= (total_end_time_seconds - total_start_time_seconds);

            


            async function calculateTotalHoursAsync(total_sch_seconds) {
               
               var total_hours = await calculateTotalHours(total_sch_seconds);

                var schedule_time_array = {

                    start_time_seconds:total_start_time_seconds,
                    end_time_seconds:total_end_time_seconds,
                    total_sch_hours:total_hours
                };

            
                updatedataWhere = {};
                updatedataWhere['day_name']  = 'All_Days_Total';
                updatedataWhere['work_week'] = scheduleworkertime.work_week;
                updatedataWhere['work_year'] = scheduleworkertime.work_year;
                updatedataWhere['companyObjectId'] = scheduleworkertime.companyObjectId;
        
                Scheduledefault.findOneAndUpdate(updatedataWhere, 
                  {schedule_time_array:schedule_time_array}, {new:true}, 
                  function(err4, data){
      
                    if (err4) {
                      console.log(err4);
                    } 

                    var res_return = {};
                    res_return['success'] = 1;
                    res_return['data'] = null;
                    resolve(res_return);
              });

            }


            calculateTotalHoursAsync(total_sch_seconds); 

        })

    })

  })
}


exports.get_worker_schedule_day_detail = (req, res, next) => {
      Scheduleworkertime.aggregate([
      {
        $match: {
            worker_id : mongoose.Types.ObjectId(req.body.worker_id),
            day_name:req.body.day_name,
            work_week:req.body.current_week,
            work_year:req.body.current_year
        }
      },{
        $lookup: {
          from: "scheduleworkerstartstoplogs",
          localField: "_id",
          foreignField: "schedule_id",
          as: "scheduleworkerstartstoplogs"
        }
      },

      ]).exec(function (err, Checklist) {
          console.log('req.body ',req.body)
          console.log('Checklist ',Checklist)
          //console.log(JSON.stringify(Checklist));

          var res_return = {};
          res_return['success'] = 1;
          res_return['data'] = Checklist['0'];
          return res.json(res_return);

      })
}



exports.worker_schedule_record = (req, res, next) => {
    
    console.log("DD");

    switch(req.body.schd_rptd){

      case 'schd':

        Scheduleworkertime.aggregate([
        {
          $match: {
              _id : mongoose.Types.ObjectId(req.body.current_schedule_id)
          }
        },

        ]).exec(function (err, result_set) {
            
            var res_return = {};
            res_return['success'] = 1;
            res_return['data'] = result_set['0'];
            return res.json(res_return);

        })
        
      break;

      case 'rptd':

        Scheduleworkerstartstoplog.aggregate([
        {
          $match: {
              _id : mongoose.Types.ObjectId(req.body.record_id)
          }
        },

        ]).exec(function (err, result_set) {
            
            var res_return = {};
            res_return['success'] = 1;
            res_return['data'] = result_set['0'];
            return res.json(res_return);

        })
  
      break;
  
    }


}




/*In case you need all record then set archieveRecord = true, While calling
this function*/
exports.get_worker_and_schedule_listing = (req, res, next) => {
      
      var current_week = ""+req.body.current_week+"";
      var current_year = ""+req.body.current_year+"";
      
      Users.aggregate([
      {
        $match: {
            user_Role : {$ne:"admin"},
            is_deleted: {$ne : '1'},
            companyId : req.body.companyId,
            archieveRecord:req.body.archieveRecord
        }
      },
      // {
      //   $lookup: {
      //     from: "scheduleworkertimes",
      //     localField: "_id",
      //     foreignField: "worker_id",
      //     as: "schedule_worker_timeslist"
      //   }
      // },

      // above code commented and below is added for getting schedules week and year wise
      { $lookup:
           {
             from: "scheduleworkertimes",
             let: { worker_id: "$_id",current_week:current_week, current_year:current_year},
             pipeline: [
                  { $match:
                      { $expr:
                          { $and:
                              [
                                { $eq: [ "$worker_id", "$$worker_id"] },
                                { $eq: [ "$work_week", "$$current_week"] },
                                { $eq: [ "$work_year", "$$current_year"] }
                              ]
                          }
                      }
                  }
              ],
              as: "schedule_worker_timeslist"
              }
       },

      // {
      //   $lookup: {
      //     from: "scheduleworkertimeweeks",
      //     localField: "_id",
      //     foreignField: "worker_id",
      //     as: "schedule_worker_time_weeks"
      //   }
      // }

      // above code commented and below is added for getting schedules week and year wise
      { $lookup:
           {
             from: "scheduleworkertimeweeks",
             let: { worker_id: "$_id",current_week:current_week, current_year:current_year},
             pipeline: [
                  { $match:
                      { $expr:
                          { $and:
                              [
                                { $eq: [ "$worker_id", "$$worker_id"] },
                                { $eq: [ "$work_week", "$$current_week"] },
                                { $eq: [ "$work_year", "$$current_year"] }
                              ]
                          }
                      }
                  }
              ],
              as: "schedule_worker_time_weeks"
              }
       },
      
       {$sort: {user_First_Name: 1}}
      ]).collation({locale: "en" }).exec(function (err, check_and_task) {

            var 
            whereArray={};
            whereArray['work_week']  = req.body.current_week;
            whereArray['work_year']  = req.body.current_year;
            whereArray['companyObjectId'] = mongoose.Types.ObjectId(req.body.companyId);
            

            Scheduledefault.find(whereArray, function(err4, scheduledefaults){

                var res_return={};
                res_return['success'] = 1;
                res_return['data'] = check_and_task;
                res_return['data2'] = scheduledefaults;

                //console.log(JSON.stringify(res_return));

                return res.json(res_return);


            })

      })
}




exports.schedule_default_record = (req, res, next) => {
      
    Scheduledefault.find({_id:mongoose.Types.ObjectId(req.body.record_id)}, function(err4, scheduledefaults){

            var res_return={};
            res_return['success'] = 1;
            res_return['data'] = scheduledefaults;

            return res.json(res_return);


      })
}

exports.get_disable_schedule = (req, res, next) => {
    
    if(req.body.disable_entity === 'disabled_day'){

      Scheduleworkertime.remove({_id:mongoose.Types.ObjectId(req.body.record_id)}, function(err, remove_record){
            
            var whereArray = {}
            whereArray['worker_id'] = mongoose.Types.ObjectId(req.body.paramsArray.worker_id);
            whereArray['day_name']  = 'All_Days_Total';
            whereArray['work_week'] = req.body.paramsArray.current_week;
            whereArray['work_year'] = req.body.paramsArray.current_year;


            Scheduleworkertime.findOne(whereArray, function(err4, scheduleworkertime){

                  if(scheduleworkertime){

                    async function getSyncAllDayTotalAsync(req, res, scheduleworkertime, whereArray) {

                      var response = await getSyncAllDayTotal(req, res, scheduleworkertime, whereArray);

                        var res_return = {};
                        res_return['success'] = 1;
                        res_return['data'] = remove_record;
                        return res.json(res_return);

                    }

                    getSyncAllDayTotalAsync(req, res, scheduleworkertime, whereArray);
                    socketapp.scheduleListOnSocket(req.body.paramsArray.worker_id,'All_Days_Total',req.body.paramsArray.current_week,req.body.paramsArray.current_year);
                  }  
            })    

      })

    } else {

        var whereArray = {}
        whereArray['worker_id'] = mongoose.Types.ObjectId(req.body.paramsArray.worker_id);
        whereArray['work_week'] = req.body.paramsArray.current_week;
        whereArray['work_year'] = req.body.paramsArray.current_year;

        Scheduleworkertime.remove(whereArray, function(err, remove_record){
              
            Scheduleworkertimeweek.remove(whereArray, function(err, remove_record){

              var res_return = {};
              res_return['success'] = 1;
              res_return['data'] = remove_record;
              return res.json(res_return);

            })    
        }) 
    }
}




exports.get_enable_schedule = (req, res, next) => {
  
  var 
  whereArray ={};
  whereArray['companyObjectId']= mongoose.Types.ObjectId(req.body.send_data.companyId);
  whereArray['work_week']= req.body.send_data.current_week;
  whereArray['work_year']= req.body.send_data.current_year;
  whereArray['day_name']= {$ne:'All_Days_Total'}

  Scheduledefault.find(whereArray, function(err4, scheduledefault){

      
        function asyncloop(loop,scheduledefault,callback){  

          if(loop <scheduledefault.length){


              async function scheduleWorkerTimeInsAsync(req, res, next, scheduledefault) {
  
                req.body.worker_id  = req.body.send_data.worker_id;
                req.body.day_name   = scheduledefault[loop].day_name;
                req.body.work_week  = scheduledefault[loop].work_week;
                req.body.work_year  = scheduledefault[loop].work_year;
                req.body.sch_start_time  = scheduledefault[loop].schedule_time_array['0'].start_time_seconds;
                req.body.sch_end_time    = scheduledefault[loop].schedule_time_array['0'].end_time_seconds;
                req.body.created_by      = scheduledefault[loop].created_at;
                req.body.companyId = scheduledefault[loop].companyObjectId;

                var response = await scheduleWorkerTimeIns(req, res, next);
                
                if(response){
                  asyncloop(loop+1,scheduledefault,callback); 
                }

              }
              
              scheduleWorkerTimeInsAsync(req, res, next, scheduledefault);
           

          } else {

            callback();

          }
        }

        asyncloop(0,scheduledefault,function(){

              var res_return = {};
              res_return['success'] = 1;
              res_return['data'] = null;
              return res.json(res_return);

        })      

  })

}



exports.co_default_sch_to_all_users = (req, res, next) => {

  Users.find({
    user_Role : {$ne:"admin"},
    is_deleted: {$ne : '1'},
    companyId : req.body.send_data.companyId
  }, function(err4, users){


       function asyncloop(loop,users,callback){  

          if(loop <users.length){

            
            var 
            whereArray ={};
            whereArray['companyObjectId']= mongoose.Types.ObjectId(req.body.send_data.companyId);
            whereArray['work_week']= req.body.send_data.current_week;
            whereArray['work_year']= req.body.send_data.current_year;
            whereArray['day_name']= {$ne:'All_Days_Total'}

            Scheduledefault.find(whereArray, function(err4, scheduledefault){

              function asyncloopInner_1(loopInner_1,scheduledefault,callbackInner_1){  

                if(loopInner_1 < scheduledefault.length){

                    async function scheduleWorkerTimeInsAsync(req, res, next, scheduledefault) {
                      
                     
                      req.body.worker_id  = users[loop]._id;
                      req.body.day_name   = scheduledefault[loopInner_1].day_name;
                      req.body.work_week  = scheduledefault[loopInner_1].work_week;
                      req.body.work_year  = scheduledefault[loopInner_1].work_year;
                      req.body.sch_start_time  = scheduledefault[loopInner_1].schedule_time_array['0'].start_time_seconds;
                      req.body.sch_end_time    = scheduledefault[loopInner_1].schedule_time_array['0'].end_time_seconds;
                      req.body.created_by      = scheduledefault[loopInner_1].created_at;
                      req.body.companyId = scheduledefault[loopInner_1].companyObjectId;
                      var response = await scheduleWorkerTimeIns(req, res, next);
                      if(response){
                        asyncloopInner_1(loopInner_1+1,scheduledefault,callbackInner_1); 
                      }

                    }
                    
                    scheduleWorkerTimeInsAsync(req, res, next, scheduledefault);
                 

                } else {

                  callbackInner_1();

                }
              }


              asyncloopInner_1(0,scheduledefault,function(){
                    /*This loop will be run once a single iteration has be executed for one user*/
                    asyncloop(loop+1,users,callback);   
                    var res_return = {};
                    res_return['success'] = 1;
                    res_return['data'] = null;
                    return(res_return);

              })   

            })

          } else {

            callback();

          }
        }


      /*Outer loop*/      
      asyncloop(0,users,function(){

            var 
            res_return = {};
            res_return['success'] = 1;
            res_return['data'] = null;
            return res.json(res_return);

      })      
      /*Outer loop*/

  })
}


exports.disable_default_schedule = (req, res, next) => {
    
    if(req.body.disable_entity === 'disabled_default_day'){

      Scheduledefault.remove({_id:mongoose.Types.ObjectId(req.body.record_id)}, function(err, remove_record){
            
            var whereArray = {}
            whereArray['day_name']  = 'All_Days_Total';
            whereArray['work_week'] = req.body.paramsArray.current_week;
            whereArray['work_year'] = req.body.paramsArray.current_year;


            Scheduledefault.findOne(whereArray, function(err4, scheduledefault){

                  if(scheduledefault){

                    async function getSyncSchDefAllDayTotalAsync(req, res, scheduledefault) {

                      var response = await getSyncSchDefAllDayTotal(req, res, scheduledefault);

                        var res_return = {};
                        res_return['success'] = 1;
                        res_return['data'] = null;
                        return res.json(res_return);

                    }

                    getSyncSchDefAllDayTotalAsync(req, res, scheduledefault);
                    //socketapp.scheduleListOnSocket(req.body.paramsArray.worker_id,'All_Days_Total',req.body.paramsArray.current_week,req.body.paramsArray.current_year);
                  }  
            })    

      })

    } else {

        var whereArray = {}
        whereArray['worker_id'] = mongoose.Types.ObjectId(req.body.paramsArray.worker_id);
        whereArray['work_week'] = req.body.paramsArray.current_week;
        whereArray['work_year'] = req.body.paramsArray.current_year;

        Scheduleworkertime.remove(whereArray, function(err, remove_record){
              
            Scheduleworkertimeweek.remove(whereArray, function(err, remove_record){

              var res_return = {};
              res_return['success'] = 1;
              res_return['data'] = remove_record;
              return res.json(res_return);

            })    
        }) 
    }
}


/*Mobile apis*/
exports.worker_schedule = (req, res) => {
      console.log('BB');
      var current_week = ""+req.body.current_week+"";
      var current_year = ""+req.body.current_year+"";

      Users.aggregate([
      {
        $match: {
          _id : mongoose.Types.ObjectId(req.body.assignment_assignToUserId),
          is_deleted: {$ne : '1'}
        }
      },

       { $lookup:
           {
             from: "scheduleworkertimes",
             let: { worker_id: "$_id",current_week:current_week, current_year:current_year},
             pipeline: [
                  { $match:
                      { $expr:
                          { $and:
                              [
                                { $eq: [ "$worker_id", "$$worker_id"] },
                                { $eq: [ "$work_week", "$$current_week"] },
                                { $eq: [ "$work_year", "$$current_year"] }
                              ]
                          }
                      }
                  }
              ],
              as: "schedule_worker_times"
              }
       },
       //{$sort: {"schedule_worker_times._id": 1}}

      ]).exec(function (err, check_and_task) {

        var 
        res_return={};
        res_return['success'] = 1;
        res_return['data'] = check_and_task;
        return res.json(res_return);

      })

}



exports.worker_schedule_save = (req, res) => {
    console.log('AA');
    var worker_id        = req.body.worker_id;
    var schedule_id      = req.body.schedule_id;
    var day_name         = req.body.day_name;
    var work_week        = req.body.work_week;
    var work_year        = req.body.work_year;
    var created_by       = req.body.created_by;
    var assignmentStatus = req.body.assignmentStatus;
    var start_time_24Hrs  = 0;
    var end_time_24Hrs    = 0;
    var start_time_12Hrs  = 0;
    var end_time_12Hrs    = 0;
    var total_sch_seconds = 0;
    var total_rptd_hours  = 0;


    Scheduleworkertime.findOne({
      _id:mongoose.Types.ObjectId(schedule_id)
    }, function(err4, scheduleworkertime){

      if(scheduleworkertime){
                   
          if(scheduleworkertime.reported_time_array['0'].start_time_seconds){
            var sch_start_time  = scheduleworkertime.reported_time_array['0'].start_time_seconds;
          } else {
            var sch_start_time  = req.body.sch_start_time;
          } 

          if(req.body.sch_end_time){
            var sch_end_time  = req.body.sch_end_time;  
          } else {
            var sch_end_time  = scheduleworkertime.reported_time_array['0'].end_time_seconds; 
          }
          

          if(sch_end_time > sch_start_time){
            var start_time_24Hrs  = (new Date).clearTime().addSeconds(sch_start_time).toString('HH:mm');
            var end_time_24Hrs    = (new Date).clearTime().addSeconds(sch_end_time).toString('HH:mm');
            var start_time_12Hrs  = (new Date).clearTime().addSeconds(sch_start_time).toString('hh:mm tt');
            var end_time_12Hrs    = (new Date).clearTime().addSeconds(sch_end_time).toString('hh:mm tt');
            var total_sch_seconds = (sch_end_time - sch_start_time);
            var total_rptd_hours  = (new Date).clearTime().addSeconds(total_sch_seconds).toString('HH:mm');
          } else {
            var start_time_24Hrs  = (new Date).clearTime().addSeconds(sch_start_time).toString('HH:mm');
            var end_time_24Hrs    = '00:00';
            var start_time_12Hrs  = (new Date).clearTime().addSeconds(sch_start_time).toString('hh:mm tt');
            var end_time_12Hrs    = '00:00';
          }
  
          var reported_time_array = {
              start_time_seconds:sch_start_time,
              end_time_seconds:sch_end_time,
              start_time_24Hrs:start_time_24Hrs,
              end_time_24Hrs:end_time_24Hrs,
              start_time_12Hrs:start_time_12Hrs,
              end_time_12Hrs:end_time_12Hrs,
              total_rptd_hours:total_rptd_hours,
          };

          Scheduleworkertime.findOneAndUpdate(
              {_id:mongoose.Types.ObjectId(schedule_id)}, 
              {reported_time_array:reported_time_array,assignmentStatus:assignmentStatus}, {new:true}, 
              function(err4, scheduleworkertime_upd){


                Scheduleworkerstartstoplog.findOne({
                  schedule_id:mongoose.Types.ObjectId(schedule_id),
                  end_time_seconds:{$eq:null}}, 
                  function(err4, scheduleworkerstartstoplog){

                    if(scheduleworkerstartstoplog){
        
                        var start_time_24Hrs_log  = (new Date).clearTime().addSeconds(scheduleworkerstartstoplog.start_time_seconds).toString('HH:mm');
                        var end_time_24Hrs_log    = (new Date).clearTime().addSeconds(req.body.sch_end_time).toString('HH:mm');
                        var start_time_12Hrs_log  = (new Date).clearTime().addSeconds(scheduleworkerstartstoplog.start_time_seconds).toString('hh:mm tt');
                        var end_time_12Hrs_log    = (new Date).clearTime().addSeconds(req.body.sch_end_time).toString('hh:mm tt');

                        /*Update*/
                        Scheduleworkerstartstoplog.findOneAndUpdate(
                        {_id:mongoose.Types.ObjectId(scheduleworkerstartstoplog._id)}, 
                        {
                          end_time_seconds:req.body.sch_end_time,
                          start_time_24Hrs:start_time_24Hrs_log,
                          end_time_24Hrs:end_time_24Hrs_log,
                          start_time_12Hrs:start_time_12Hrs_log,
                          end_time_12Hrs:end_time_12Hrs_log
                        }, {new:true}, 
                        function(err4, scheduleworkertime_upd){

                           async function workerWorkingHoursAsync(req, res, scheduleworkertime) {

                            var response = await workerWorkingHours(req, res, scheduleworkertime);


                              Scheduleworkertime.findOneAndUpdate(
                                {_id:mongoose.Types.ObjectId(schedule_id)}, 
                                {start_stop_status:'STOP'}, {new:true}, 
                                function(err4, scheduleworkertime_upd){
                                  socketapp.adminSideScheduleStatusOnSocket(scheduleworkertime.companyObjectId);
                                  var 
                                  res_return={};
                                  res_return['success'] = 1;
                                  res_return['data'] = 'Time is Stoped';
                                  return res.json(res_return);


                              })


                           }


                          workerWorkingHoursAsync(req, res, scheduleworkertime);

                        })

                    } else {

                      /*Insert*/
                      const scheduleworkerstartstoplog = new Scheduleworkerstartstoplog({
                        worker_id:worker_id,
                        schedule_id:schedule_id,
                        day_name:day_name,
                        work_week:work_week,
                        work_year:work_year,
                        start_time_seconds:req.body.sch_start_time,
                        end_time_seconds: null,
                        created_by:created_by
                      });
                      scheduleworkerstartstoplog.save().then(createdObject => {
                          
                        Scheduleworkertime.findOneAndUpdate(
                          {_id:mongoose.Types.ObjectId(schedule_id)}, 
                          {start_stop_status:'START'}, {new:true}, 
                          function(err4, scheduleworkertime_upd){
                            socketapp.adminSideScheduleStatusOnSocket(scheduleworkertime.companyObjectId);
                            var 
                            res_return={};
                            res_return['success'] = 1;
                            res_return['data'] = 'Time is Started';
                            return res.json(res_return);


                        })

                      })

                    }

                })
                
          });

      }


    })

}


/*Here we are calculating worker actuly working hours for 
a particular day. After that go to sync weekly time*/
function workerWorkingHours(req, res, scheduleworkertime){
  console.log('DD');
  
  return new Promise(function(resolve, reject) {  
  

  var total_start_time_seconds=0;
  var total_end_time_seconds=0; 
  var total_work_time=0;
  


  Scheduleworkerstartstoplog.find({
    schedule_id:mongoose.Types.ObjectId(scheduleworkertime._id)}, 
    function(err4, scheduleworkerstartstoplog){

        

        function asyncloop(loop,scheduleworkerstartstoplog,callback){  

          if(loop <scheduleworkerstartstoplog.length){

            total_start_time_seconds = parseInt(total_start_time_seconds) + parseInt(scheduleworkerstartstoplog[loop].start_time_seconds);
            total_end_time_seconds   = parseInt(total_end_time_seconds) + parseInt(scheduleworkerstartstoplog[loop].end_time_seconds);

            asyncloop(loop+1,scheduleworkerstartstoplog,callback); 

          } else {

            callback();

          }
        }

        asyncloop(0,scheduleworkerstartstoplog,function(){

                /*Here we are checking total hours workers has did job.
                For example if worker stop work in between and start again
                all cases are coverd up*/
                var start_time_24Hrs = (new Date).clearTime().addSeconds(total_start_time_seconds).toString('HH:mm');
                var end_time_24Hrs   = (new Date).clearTime().addSeconds(total_end_time_seconds).toString('HH:mm');
                var start_time_12Hrs = (new Date).clearTime().addSeconds(total_start_time_seconds).toString('hh:mm tt');
                var end_time_12Hrs   = (new Date).clearTime().addSeconds(total_end_time_seconds).toString('hh:mm tt');
                var total_work_seconds= (total_end_time_seconds - total_start_time_seconds);

               
                let totalSeconds = total_work_seconds;
                let hours = Math.floor(totalSeconds / 3600);
                totalSeconds %= 3600;
                let minutes = Math.floor(totalSeconds / 60);
                let seconds = totalSeconds % 60;
                minutes = String(minutes).padStart(2, "0");
                hours = String(hours).padStart(2, "0");
                seconds = String(seconds).padStart(2, "0");
                var total_work_hours = hours + ":" + minutes;

                var worked_time_array = {
                    start_time_seconds:total_start_time_seconds,
                    end_time_seconds:total_end_time_seconds,
                    total_work_hours:total_work_hours
                };

                Scheduleworkertime.findOneAndUpdate(
                  {_id:mongoose.Types.ObjectId(scheduleworkertime._id)}, 
                  {worked_time_array:worked_time_array}, {new:true}, function(err4, data){
      
                    /*Now sync weekly reported hours*/
                    async function getSyncAllReportedDayTotalAsync(req, res, scheduleworkertime) {

                        var response = await getSyncAllReportedDayTotal(req, res, scheduleworkertime);

                        if(response){
                            var res_return = {};
                            res_return['success'] = 1;
                            res_return['data'] = null;
                            resolve(res_return);
                        } 

                    }
                    
                    getSyncAllReportedDayTotalAsync(req, res, scheduleworkertime);
                    /*Now sync weekly reported hours*/

                })

        })

    }) 
  })      
}