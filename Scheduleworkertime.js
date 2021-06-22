import React, { Component } from "react";

import { render } from "react-dom";
import Card from "@material-ui/core/Card";
import Button from "@material-ui/core/Button";

import { Link, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import validator from "validator";
import MyModal, { toggleModal } from "../helper/MyModal";

import ApiManager from "../helper/ApiManager";
import MySelection from "../helper/MySelection";
import MenuItem from "@material-ui/core/MenuItem";
import moment from "moment";

import MyTextField from "../helper/MyTextField";
import { LocalStorage } from "../helper/LocalStorage";
import Chat from "./../pages/Chat/Chat";

import Styles from "./Styles";

import { Form, Field } from "react-final-form";
import arrayMutators from "final-form-arrays";
import { FieldArray } from "react-final-form-arrays";

import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import $ from "jquery";

import { confirmAlert } from "react-confirm-alert"; // Import
import "react-confirm-alert/src/react-confirm-alert.css"; // Import css

import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";

import TimePicker from "react-bootstrap-time-picker";
import Sidebar from "./common/Sidebar";
import Header from "./common/Header";

import "./style.css";

import DayPicker from "react-day-picker";
import "react-day-picker/lib/style.css";
import CopyIcon from "../../images/copy.svg";
import openSocket from 'socket.io-client';
const socket = openSocket(window.$port_url);
var currentWeekNumber = require("current-week-number");

const DELETE_SUBARRAY_MODAL_ID = "deletesubarraymodalid";
const DELETE_MODAL_ID = "deletemodalid";
const ADD_MODAL_ID = "addmodalid";
const UPDATE_SOPS_MODAL_ID = "updatemodalid";
var days_array = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

class Scheduleworkertime extends Component {
  constructor(props) {
    super(props);
    this.userId = "";
    this.user = "";
    this.companyId = "";

    this.handleSTimeChange = this.handleSTimeChange.bind(this);
    this.handleETimeChange = this.handleETimeChange.bind(this);
    this.handleRSTimeChange = this.handleRSTimeChange.bind(this);
    this.handleRETimeChange = this.handleRETimeChange.bind(this);

    this.handleSSSTimeChange = this.handleSSSTimeChange.bind(this);
    this.handleSSETimeChange = this.handleSSETimeChange.bind(this);

    this.handleDSSTimeChange = this.handleDSSTimeChange.bind(this);
    this.handleDSETimeChange = this.handleDSETimeChange.bind(this);

    this.state = {
      user_listing_data: [],
      check_task_listing_data: [],
      site_listing_data: [],
      selected: [],
      schedule_default: [],
      work_assigned_day_detail: [],
      work_assigned_day_detail_edit: [],
      cheklist_task_name: "",
      open: false,
      openEdit: false,
      work_assigned_listing: [],
      disble_submit_button: true,
      current_work_id: "",
      chklst_task_id_hi2: "",
      current_week: "",
      current_year: "",
      current_year_week: new Date().getFullYear() + "-W" + currentWeekNumber(),
      isLoading: false,
      loaderMain: true,
      sch_start_time: 0,
      sch_end_time: 0,
      rptd_start_time: 0,
      rptd_end_time: 0,
      current_schedule_id: "",
      show_this_view: "generateDyanamicForm",
      selectedDays: [],
      modifiers:""
    };
  }

  componentDidMount() {
    this.state.modifiers = {
      highlighted: this.state.selectedDays[0],
    };
    
    this.user = new LocalStorage().getUserData();
    this.user = JSON.parse(this.user);
    console.log("user>>>", this.user);
    this.adminId = this.user.userId;
    this.companyId = this.user.companyId;
    this.setState({
      companyName: this.user.companyName,
    });

    setTimeout(() => {
      this.setState({
        loaderMain: false,
      });
    }, 3000);

    this.reloadOnWeekChange(this.state.current_year_week);
    this.checkAndTaskListing();
    this.getSiteListing();
    //this.getWorkAssignedListing();
    this.handleDayChange(new Date());

    $(document).on('click','.close_calendar',function(){
      $(".DayPicker").hide();
      $(".DayPicker-NavBar").hide();
      $(this).hide();
    })

    socket.on("adminSideScheduleStatusOnSocket", (obj) => {
        if (obj) {
            if(obj.companyObjectId == this.user.companyId){
                this.getWorkersAndScheduleListing();
            }
        }
    });
  }

  resetToTodayDate = () => {
    this.handleDayChange(new Date());
  };
  changeToPrevWeek = () => {
    var currentWeek = this.state.current_week;
    var currentYear = this.state.current_year;
    var prevWeek;
    var prevYear;
    var totalWeeks = this.weeksInYear(parseInt(this.state.current_year) - 1);
    if (parseInt(currentWeek) == 1) {
      prevWeek = totalWeeks;
      prevYear = parseInt(currentYear) - 1;
    } else {
      prevWeek = parseInt(currentWeek) - 1;
      prevYear = currentYear;
    }
    var res = this.getDateRangeOfWeek_2(prevWeek, prevYear);
    this.handleWeekClick(prevWeek, this.getWeekDays(new Date(res)));
    setTimeout(() => {
      this.setState({
        selectedDays: this.getWeekDays(new Date(res)),
        current_week: "" + prevWeek + "",
        current_year: "" + prevYear + "",
      });
    }, 500);
  };

  get_Week_Number = (d) => {
    d = new Date(+d);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    var yearStart = new Date(d.getFullYear(), 0, 1);
    var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return [d.getFullYear(), weekNo];
  };

  weeksInYear = (year) => {
    var month = 11,
      day = 31,
      week;

    do {
      var d = new Date(year, month, day--);
      week = this.get_Week_Number(d)[1];
    } while (week == 1);

    return week;
  };

  changeToNextWeek = () => {
    var currentWeek = this.state.current_week;
    var currentYear = this.state.current_year;
    var nextWeek;
    var nextYear;
    var totalWeeks = this.weeksInYear(parseInt(this.state.current_year));
    if (parseInt(currentWeek) == parseInt(totalWeeks)) {
      nextWeek = 1;
      nextYear = parseInt(currentYear) + 1;
    } else {
      nextWeek = parseInt(currentWeek) + 1;
      nextYear = currentYear;
    }

    var res = this.getDateRangeOfWeek(nextWeek, nextYear);
    this.handleWeekClick(nextWeek, this.getWeekDays(new Date(res)));
    setTimeout(() => {
      this.setState({
        selectedDays: this.getWeekDays(new Date(res)),
        current_week: "" + nextWeek + "",
        current_year: "" + nextYear + "",
      });
    }, 500);
  };

  getDateRangeOfWeek = (weekNo, year) => {
    var d1 = this.state.selectedDays[6];
    var numOfdaysPastSinceLastMonday = eval(d1.getDay());
    d1.setDate(d1.getDate() - numOfdaysPastSinceLastMonday);
    var weekNoToday = this.state.current_week;
    var weeksInTheFuture = eval(weekNo - weekNoToday);
    weeksInTheFuture = 1;
    d1.setDate(d1.getDate() + eval(7 * weeksInTheFuture));
    var rangeIsFrom =
      eval(d1.getMonth() + 1) + "/" + d1.getDate() + "/" + d1.getFullYear();
    d1.setDate(d1.getDate() + 6);
    var rangeIsTo =
      eval(d1.getMonth() + 1) + "/" + d1.getDate() + "/" + d1.getFullYear();
    return rangeIsFrom;
  };
  getDateRangeOfWeek_2 = (weekNo, year) => {
    var d1 = this.state.selectedDays[0];
    var numOfdaysPastSinceLastMonday = eval(d1.getDay());
    d1.setDate(d1.getDate() - numOfdaysPastSinceLastMonday);
    var weekNoToday = this.state.current_week;
    var weeksInTheFuture = eval(weekNo - weekNoToday);
    weeksInTheFuture = -1;
    d1.setDate(d1.getDate() + eval(7 * weeksInTheFuture));
    var rangeIsFrom =
      eval(d1.getMonth() + 1) + "/" + d1.getDate() + "/" + d1.getFullYear();
    d1.setDate(d1.getDate() + 6);
    var rangeIsTo =
      eval(d1.getMonth() + 1) + "/" + d1.getDate() + "/" + d1.getFullYear();
    return rangeIsFrom;
  };

  async handleDayChange(date) {
    this.setState(
      {
        selectedDays: this.getWeekDays(this.getWeekRange(date).from),
        current_week: "" + this.getWeekNumber(date) + "",
        current_year: "" + date.getFullYear() + "",
      },
      () => this.getWorkersAndScheduleListing()
    );

    $(".DayPicker").hide();
    $(".DayPicker-NavBar").hide();
    $('.close_calendar').hide();
  }
  handleDayEnter = (date) => {
    this.setState({
      hoverRange: this.getWeekRange(date),
    });
  };
  handleDayLeave = () => {
    this.setState({
      hoverRange: undefined,
    });
  };
  handleWeekClick = (weekNumber, days, e = null) => {
    this.setState(
      {
        current_year: "" + days[0].getFullYear() + "",
        selectedDays: days,
        current_week: "" + weekNumber + "",
      },
      () => this.getWorkersAndScheduleListing()
    );
    $(".DayPicker").hide();
    $(".DayPicker-NavBar").hide();
    $('.close_calendar').hide();
  };
  handleClick(e) {
    $(".SelectedWeekExample").show();
    $(".DayPicker").show();
    $(".DayPicker-NavBar").show();
    $('.close_calendar').show();
    $("#day-picker").removeClass("hideClass_day_picker");
  }
  getWeekRange(date) {
    return {
      from: moment(date).startOf("week").toDate(),
      to: moment(date).endOf("week").toDate(),
    };
  }
  getWeekDays(weekStart) {
    const days = [weekStart];
    for (let i = 1; i < 7; i += 1) {
      days.push(moment(weekStart).add(i, "days").toDate());
    }
    return days;
  }
  getWeekNumber = (d) => {
    var target = new Date(d.valueOf());
    var dayNr = (d.getDay() + 7) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    var jan4 = new Date(target.getFullYear(), 0, 4);
    var dayDiff = (target - jan4) / 86400000;
    var weekNr = 1 + Math.ceil(dayDiff / 7);
    return weekNr;
  };

  handleSTimeChange(sch_start_time) {
    this.setState({ sch_start_time });
  }

  handleETimeChange(sch_end_time) {
    this.setState({ sch_end_time });
  }

  handleRSTimeChange(rptd_start_time) {
    this.setState({ rptd_start_time });
  }

  handleRETimeChange(rptd_end_time) {
    this.setState({ rptd_end_time });
  }

  handleSSSTimeChange(rptd_ss_start_time) {
    this.setState({ rptd_ss_start_time });
  }

  handleSSETimeChange(rptd_ss_end_time) {
    this.setState({ rptd_ss_end_time });
  }

  handleDSSTimeChange(def_sch_start_time) {
    this.setState({ def_sch_start_time });
  }

  handleDSETimeChange(def_sch_end_time) {
    this.setState({ def_sch_end_time });
  }

  copyScheduleToNextWeek = (event) => {
    event.preventDefault();
    var currentWeek = this.state.current_week;
    var currentYear = this.state.current_year;
    var nextWeek = "" + (parseInt(this.state.current_week) + 1) + "";
    var lastWeek = this.getWeekNumber(
      new Date(new Date().getFullYear(), 11, 31)
    );
    var updated_next_week;
    var updated_next_year;
    if (nextWeek <= lastWeek) {
      updated_next_week = nextWeek;
      updated_next_year = currentYear;
    } else {
      updated_next_week = 1;
      updated_next_year = parseInt(currentYear) + 1;
    }
    // save data
    let send_data = {};
    send_data = {
      adminId: this.adminId,
      companyId: this.companyId,
      current_week: currentWeek,
      next_week: updated_next_week,
      current_year: currentYear,
      next_year: updated_next_year,
    };
    this.setState({
      showcheckdetailonclick: true,
      loader: true,
      show_this_view: "generateStaticForm",
    });
    new ApiManager().copyWorkerScheduleToNextWeek(send_data).then((result) => {
      if (result.no_result) {
        return;
      }
      if (result.data) {
        if (result.data.error) {
          return;
        }
      }
      this.setState({
        force_refresh_main_view: "1",
        isLoading: false,
        open: false,
        show_this_view: "generateDyanamicForm",
      });
      this.getWorkersAndScheduleListing();
    });
    // save data
  };
  // my function

  async reloadOnWeekChange(week_number) {
    var split_week_number = week_number?week_number.split("-"):"";

    var year_number = split_week_number["0"]?split_week_number["0"]:"";
    var week_number = split_week_number["1"]?split_week_number["1"].substring(1, 3):"";

    await this.setState({
      current_week: week_number,
      current_year: year_number,
    });

    this.getWorkersAndScheduleListing();
  }

  getWorkersAndScheduleListing = () => {
    let newDate = new Date();

    let paramsArray = {
      companyId: this.companyId,
      current_week: this.state.current_week,
      current_year: this.state.current_year,
      archieveRecord: "false",
    };

    this.setState({
      show_this_view: "generateStaticForm",
    });

    return new ApiManager()
      .getWorkersAndScheduleListing(paramsArray, false)
      .then((result) => {
        if (result.no_result) {
          return;
        }
        if (result.error) {
          return;
        }
        if (result) {
          if (result.data) {
            if (result.data.data) {
              console.log("first function");
              console.log(result.data.data);
              this.setState({
                user_listing_data: result.data.data,
                schedule_default: result.data.data2,
                isLoading: true,
                show_this_view: "generateDyanamicForm",
              });
            }
          }
        }
      });
  };

  checkAndTaskListing = () => {
    return new ApiManager()
      .checkAndTaskListing(this.companyId, 0)
      .then((result) => {
        if (result.no_result) {
          return;
        }
        if (result.error) {
          return;
        }
        if (result) {
          if (result.data) {
            if (result.data.data) {
              /*Make a list here*/

              this.setState({
                check_task_listing_data: result.data.data,
                isLoading: false,
              });
            }
          }
        }
      });
  };

  openAssignWorkSection = (section_uid) => {
    alert(section_uid);
  };

  onOpenModal = (
    worker_id,
    day_name,
    action,
    record_id = null,
    schd_rptd = null
  ) => {
    this.setState({
      show_this_view: "generateStaticForm",
    });

    var current_schedule_id;
    let newDate = new Date();

    let paramsArray = {
      worker_id: worker_id,
      day_name: day_name,
      current_week: this.state.current_week,
      current_year: this.state.current_year,
      companyId: this.companyId,
    };

    switch (action) {
      case "disabled":
        return new ApiManager()
          .getDisableSchedule(paramsArray, record_id, "disabled_day")
          .then((result) => {
            if (result.no_result) {
              return;
            }
            if (result.error) {
              return;
            }

            if (result) {
              this.getWorkersAndScheduleListing();
            }
          });

        break;

      case "disabled_week":
        return new ApiManager()
          .getDisableSchedule(paramsArray, record_id, "disabled_week")
          .then((result) => {
            if (result.no_result) {
              return;
            }
            if (result.error) {
              return;
            }

            if (result) {
              this.getWorkersAndScheduleListing();
            }
          });
        break;

      case "enable_week":
        return new ApiManager()
          .getEnableSchedule(paramsArray, record_id)
          .then((result) => {
            if (result.no_result) {
              return;
            }
            if (result.error) {
              return;
            }

            if (result) {
              this.getWorkersAndScheduleListing();
            }
          });

        break;

      case "add":
        this.setState({
          open: true,
          worker_id: worker_id,
          day_name: day_name,
          work_day: "",
          work_week: this.state.current_week,
          work_month: "",
          work_year: this.state.current_year,
          current_schedule_id: "",
          sch_start_time: 28800,
          sch_end_time: 61200,
        });
        break;

      case "edit":
        return new ApiManager()
          .getWorkerScheduleDayDetail(paramsArray)
          .then((result) => {
            if (result) {
              if (result.data) {
                if (result.data.data) {
                  this.setState({
                    openEdit: true,
                    worker_id: worker_id,
                    day_name: day_name,
                    work_week: this.state.current_week,
                    work_year: this.state.current_year,
                    work_schedule_day_detail_edit: result.data.data,
                    current_schedule_id: result.data.data._id,
                    sch_start_time:
                      result.data.data.schedule_time_array["0"]
                        .start_time_seconds,
                    sch_end_time:
                      result.data.data.schedule_time_array["0"]
                        .end_time_seconds,
                    start_time_12Hrs:
                      result.data.data.schedule_time_array["0"]
                        .start_time_12Hrs,
                    end_time_12Hrs:
                      result.data.data.schedule_time_array["0"].end_time_12Hrs,
                    rptd_start_time:
                      result.data.data.reported_time_array["0"]
                        .start_time_seconds,
                    rptd_end_time:
                      result.data.data.reported_time_array["0"]
                        .end_time_seconds,
                  });
                }
              }
            }
          });
        break;

      case "edit_sch_rptd_time":
        return new ApiManager()
          .getWorkerScheduleRecord(
            paramsArray,
            record_id,
            this.state.current_schedule_id,
            schd_rptd
          )
          .then((result) => {
            if (result) {
              if (result.data) {
                if (result.data.data) {
                  switch (schd_rptd) {
                    case "schd":
                      this.setState({
                        openEdit: false,
                        openRptdTimeEdit: true,
                        worker_id: worker_id,
                        work_week: this.state.current_week,
                        work_year: this.state.current_year,
                        work_start_stop_schedule: result.data.data,
                        rptd_ss_start_time:
                          result.data.data.schedule_time_array[0]
                            .start_time_seconds,
                        rptd_ss_end_time:
                          result.data.data.schedule_time_array[0]
                            .end_time_seconds,
                        current_schedule_logs_id: result.data.data._id,
                        schd_rptd: schd_rptd,
                      });
                      break;

                    case "rptd":
                      this.setState({
                        openEdit: false,
                        openRptdTimeEdit: true,
                        worker_id: worker_id,
                        work_week: this.state.current_week,
                        work_year: this.state.current_year,
                        work_start_stop_schedule: result.data.data,
                        rptd_ss_start_time: result.data.data.start_time_seconds,
                        rptd_ss_end_time: result.data.data.end_time_seconds,
                        current_schedule_logs_id: result.data.data._id,
                        schd_rptd: schd_rptd,
                      });
                      break;
                  }
                }
              }
            }
          });
        break;

      case "set_default_schedule":
        this.setState({
          open_default_schedule: true,
          day_name: day_name,
          work_day: "",
          work_week: this.state.current_week,
          work_month: "",
          work_year: this.state.current_year,
          current_def_sch_id: "",
          def_sch_start_time: 28800,
          def_sch_end_time: 61200,
        });
        break;

      case "edit_default_schedule":
        return new ApiManager()
          .getScheduleDefaultRecord(paramsArray, record_id)
          .then((result) => {
            if (result) {
              if (result.data) {
                if (result.data.data) {
                  this.setState({
                    open_default_schedule: true,
                    day_name: day_name,
                    work_day: "",
                    work_week: this.state.current_week,
                    work_month: "",
                    work_year: this.state.current_year,
                    current_def_sch_id: record_id,
                    def_sch_start_time:
                      result.data.data["0"].schedule_time_array["0"]
                        .start_time_seconds,
                    def_sch_end_time:
                      result.data.data["0"].schedule_time_array["0"]
                        .end_time_seconds,
                  });
                }
              }
            }
          });
        break;

      case "cp_default_sch_to_all_users":
        return new ApiManager()
          .coDefaultSchToAllUsers(paramsArray)
          .then((result) => {
            if (result.no_result) {
              return;
            }
            if (result.error) {
              return;
            }

            if (result) {
              //alert('1');
              this.getWorkersAndScheduleListing();
            }
          });
        break;

      case "disabled_default_schedule":
        return new ApiManager()
          .getDisableDefaultSchedule(
            paramsArray,
            record_id,
            "disabled_default_day"
          )
          .then((result) => {
            if (result.no_result) {
              return;
            }
            if (result.error) {
              return;
            }

            if (result) {
              this.getWorkersAndScheduleListing();
            }
          });

        break;
    }
  };

  onCloseModal = () => {
    this.setState({
      open: false,
      show_this_view: "generateDyanamicForm",
    });
  };

  onCloseEditModal = () => {
    this.setState({
      openEdit: false,
      show_this_view: "generateDyanamicForm",
    });
    this.getWorkersAndScheduleListing();
  };

  onCloseRptdTimeEditModal = () => {
    this.setState({
      openRptdTimeEdit: false,
    });

    this.onOpenModal(
      this.state.worker_id,
      this.state.day_name,
      "edit",
      this.state.current_schedule_id
    );
  };

  onCloseModalDefaultSchedule = () => {
    this.setState({
      open_default_schedule: false,
      show_this_view: "generateDyanamicForm",
    });
  };

  getSiteListing = () => {
    return new ApiManager()
      .getSiteListing(this.companyId, "false")
      .then((result) => {
        if (result.no_result) {
          return;
        }
        if (result.error) {
          return;
        }
        if (result) {
          if (result.data) {
            if (result.data.data) {
              this.setState({
                site_listing_data: result.data.data,
                isLoading: false,
              });
            }
          }
        }
      });
  };

  getWorkAssignedListing = () => {
    let newDate = new Date();

    let paramsArray = {
      work_day: newDate.getDate(),
      work_month: newDate.getMonth(),
      work_year: newDate.getFullYear(),
    };

    return new ApiManager()
      .getWorkAssignedListing(paramsArray)
      .then((result) => {
        if (result.no_result) {
          return;
        }
        if (result.error) {
          return;
        }
        if (result) {
          if (result.data) {
            if (result.data.data) {
              this.setState({
                work_assigned_listing: result.data.data,
                isLoading: false,
              });
            }
          }
        }
      });
  };

  removeAssignTask = (task_id) => {
    return new ApiManager()
      .removeAssignTask(this.state.current_work_id, task_id)
      .then((result) => {
        if (result.no_result) {
          return;
        }
        if (result.error) {
          return;
        }

        if (result.data) {
          this.onOpenModal(
            this.state.worker_id,
            this.state.day_name,
            this.state.assigned_works_list
          );
          this.getWorkersAndWorkListing();
        }
      });
  };

  populateValuesInFields = (fieldname, value) => {};

  weeksOptions() {
    var arr = [];

    for (let i = 1; i <= 52; i++) {
      arr.push(
        <option key={i} value={i}>
          {i}
        </option>
      );
    }

    return arr;
  }

  render() {
    return (
      <main>
        <section id="dashboard">
          <Sidebar />
          <div className="right_data_sec_main">
            <div className="right_data_sec">
              <div className="top_menu_bar">
                <Header title="Schedule Employees" />
                <div className="right_content">
                  <div>
                    {/*<nav aria-label="breadcrumb">
                                  <ol class="breadcrumb" style={{ marginBottom: '0px' }}>
                                      <li class="breadcrumb-item"><a>Dashboard</a></li>
                                      <li class="breadcrumb-item" onClick={() => { this.setState({ categoryByNameDiv: "" }) }}><a>Schedule Worker Time</a></li>
                                      
                                  </ol>
                              </nav>
                              <hr style={{
                                  marginTop: '0px',
                                  marginBottom: '0px',
                                  border: '0',
                                  borderTop: ' 2px solid rgb(93 93 93)'
                              }} />*/}

                    {this.state.loaderMain ? (
                      <div
                        style={{
                          marginTop: "40px",
                          width: "50px",
                          height: "50px",
                        }}
                        class="spinner-border text-success"
                        role="status"
                      >
                        <span class="sr-only">Loading...</span>
                      </div>
                    ) : (
                      this.pageContent()
                    )}

                    {this.pageContentModels()}
                    {this.pageContentEditModels()}
                    {this.pageContentEditRptdTimeModels()}
                    {this.pageContentDefaultScheduleModels()}

                    <div
                      style={{
                        position: "absolute",
                        right: "0px",
                        top: "100px",
                        background: "white",
                      }}
                    >
                      {this.props.user.chat.Chat ? this.chatBody() : undefined}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  pageContent = () => {
    const { listOf, listOf_error } = this.state;
    let show_this_view;

    if (this.state.show_this_view === "generateDyanamicForm") {
      show_this_view = this.generateDyanamicForm();
    } else if (this.state.show_this_view === "generateStaticForm") {
      show_this_view = this.generateStaticForm();
    }

    return (
      <div
        style={{
          padding: "50px",
          paddingLeft: "5px",
          paddingRight: "5px",
          paddingTop: "0px",
          marginBottom: "50px",
        }}
      >
        <div
          style={{
            width: "100%",
            fontSize: "13px",
          }}
        >
          <div className="row m-auto" style={{ width: "100%" }}>
            <div className="col-sm-12">
              <div style={{ width: "100%", textAlign: "left" }}>
                <div class="row mx-0">
                  <div class="col-lg-12 col-md-12 col-sm-12 px-0">
                    <div class="name_list pl-0 pr-0">{show_this_view}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  pageContentModels = () => {
    const { open } = this.state;
    const { listOf, listOf_error } = this.state;

    return (
      <div
        style={{
          padding: "50px",
          paddingLeft: "5px",
          paddingRight: "5px",
          paddingTop: "0px",
          marginBottom: "50px",
        }}
      >
        <div>
          <Modal open={open} onClose={this.onCloseModal} center>
            {/*Write complete code over here*/}

            <Styles>
              <Form
                onSubmit={this.onSubmit}
                mutators={{
                  ...arrayMutators,
                }}
                render={({
                  handleSubmit,
                  form: {
                    mutators: { push, pop },
                  }, // injected from final-form-arrays above
                  pristine,
                  form,
                  submitting,
                  values,
                }) => {
                  return (
                    <form
                      onSubmit={handleSubmit}
                      className="details_popup schedule_worker_popup"
                    >
                      <div className="picker_wraper">
                        <label>Scheduled</label>
                        <div className="fieldwrap">
                          <TimePicker
                            start="00:00"
                            end="24:00"
                            onChange={this.handleSTimeChange}
                            value={this.state.sch_start_time}
                          />
                          <TimePicker
                            start="00:00"
                            end="24:00"
                            onChange={this.handleETimeChange}
                            value={this.state.sch_end_time}
                          />
                        </div>
                      </div>

                      <button type="submit">Submit</button>
                    </form>
                  );
                }}
              />
            </Styles>

            {/*Write complete code over here*/}
          </Modal>
        </div>
      </div>
    );
  };

  pageContentEditModels = () => {
    const { openEdit } = this.state;
    const { listOf, listOf_error } = this.state;

    return (
      <div
        style={{
          padding: "50px",
          paddingLeft: "5px",
          paddingRight: "5px",
          paddingTop: "0px",
          marginBottom: "50px",
        }}
      >
        <div>
          <Modal open={openEdit} onClose={this.onCloseEditModal} center>
            {/*Write complete code over here*/}

            <Styles>
              <Form
                onSubmit={this.onSubmitEdit}
                mutators={{
                  ...arrayMutators,
                }}
                render={({
                  handleSubmit,
                  form: {
                    mutators: { push, pop },
                  }, // injected from final-form-arrays above
                  pristine,
                  form,
                  submitting,
                  values,
                }) => {
                  return (
                    <form
                      onSubmit={handleSubmit}
                      className="details_popup schedule_worker_popup"
                    >
                      <div className="picker_wraper">
                        <label>Scheduled</label>
                        <div className="fieldwrap">
                          {this.state.start_time_12Hrs}
                          --
                          {this.state.end_time_12Hrs}
                          <a
                            href="javascript:void(0)"
                            onClick={(event) =>
                              this.onOpenModal(
                                this.state.worker_id,
                                "",
                                "edit_sch_rptd_time",
                                "",
                                "schd"
                              )
                            }
                          >
                            Edit
                          </a>
                        </div>
                      </div>

                      <div className="picker_wraper">
                        <label>Reported</label>
                        {this.state.work_schedule_day_detail_edit
                          .scheduleworkerstartstoplogs &&
                          this.state.work_schedule_day_detail_edit.scheduleworkerstartstoplogs.map(
                            (sch_edit, sch_index) => {
                              return (
                                <div className="fieldwrap">
                                  {sch_edit.start_time_12Hrs}
                                  --
                                  {sch_edit.end_time_12Hrs}
                                  <a
                                    href="javascript:void(0)"
                                    onClick={(event) =>
                                      this.onOpenModal(
                                        sch_edit.worker_id,
                                        "",
                                        "edit_sch_rptd_time",
                                        sch_edit._id,
                                        "rptd"
                                      )
                                    }
                                  >
                                    Edit
                                  </a>
                                </div>
                              );
                            }
                          )}
                      </div>

                      {/*<button type="submit">
                                                      Submit
                                                    </button> */}
                    </form>
                  );
                }}
              />
            </Styles>

            {/*Write complete code over here*/}
          </Modal>
        </div>
      </div>
    );
  };

  pageContentEditRptdTimeModels = () => {
    const { openRptdTimeEdit } = this.state;
    const { listOf, listOf_error } = this.state;

    return (
      <div
        style={{
          padding: "50px",
          paddingLeft: "5px",
          paddingRight: "5px",
          paddingTop: "0px",
          marginBottom: "50px",
        }}
      >
        <div>
          <Modal
            open={openRptdTimeEdit}
            onClose={this.onCloseRptdTimeEditModal}
            center
          >
            {/*Write complete code over here*/}

            <Styles>
              <Form
                onSubmit={this.onSubmitSchRptdTimeEdit}
                mutators={{
                  ...arrayMutators,
                }}
                render={({
                  handleSubmit,
                  form: {
                    mutators: { push, pop },
                  }, // injected from final-form-arrays above
                  pristine,
                  form,
                  submitting,
                  values,
                }) => {
                  return (
                    <form
                      onSubmit={handleSubmit}
                      className="details_popup schedule_worker_popup edit_main"
                    >
                      <div className="picker_wraper">
                        <label>Update Time</label>
                        <div className="fieldwrap">
                          <TimePicker
                            start="00:00"
                            end="24:00"
                            step={1}
                            onChange={this.handleSSSTimeChange}
                            value={this.state.rptd_ss_start_time}
                          />
                          <TimePicker
                            start="00:00"
                            end="24:00"
                            step={1}
                            onChange={this.handleSSETimeChange}
                            value={this.state.rptd_ss_end_time}
                          />
                        </div>
                      </div>

                      <button type="submit">Save</button>
                    </form>
                  );
                }}
              />
            </Styles>

            {/*Write complete code over here*/}
          </Modal>
        </div>
      </div>
    );
  };

  pageContentDefaultScheduleModels = () => {
    const { open_default_schedule } = this.state;
    const { listOf, listOf_error } = this.state;

    return (
      <div
        style={{
          padding: "50px",
          paddingLeft: "5px",
          paddingRight: "5px",
          paddingTop: "0px",
          marginBottom: "50px",
        }}
      >
        <div>
          <Modal
            open={open_default_schedule}
            onClose={this.onCloseModalDefaultSchedule}
            center
          >
            {/*Write complete code over here*/}

            <Styles>
              <Form
                onSubmit={this.onSubmitDefaultSchedule}
                mutators={{
                  ...arrayMutators,
                }}
                render={({
                  handleSubmit,
                  form: {
                    mutators: { push, pop },
                  }, // injected from final-form-arrays above
                  pristine,
                  form,
                  submitting,
                  values,
                }) => {
                  return (
                    <form
                      onSubmit={handleSubmit}
                      className="details_popup schedule_worker_popup"
                    >
                      <div className="picker_wraper">
                        <label>Scheduled</label>
                        <div className="fieldwrap">
                          <TimePicker
                            start="00:00"
                            end="24:00"
                            onChange={this.handleDSSTimeChange}
                            value={this.state.def_sch_start_time}
                          />
                          <TimePicker
                            start="00:00"
                            end="24:00"
                            onChange={this.handleDSETimeChange}
                            value={this.state.def_sch_end_time}
                          />
                        </div>
                      </div>

                      <button type="submit">Submit</button>
                    </form>
                  );
                }}
              />
            </Styles>

            {/*Write complete code over here*/}
          </Modal>
        </div>
      </div>
    );
  };

  generateDyanamicForm = () => {
    const { listOf, listOf_error } = this.state;
    const list_days_array = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thrusday",
      "Friday",
      "Saturday",
      "All_Days_Total",
    ];
    let weekly_seconds = 0;

    const elements = ["one", "two", "three"];

    return (
      <Styles>
        <Form
          onSubmit={this.onSubmit}
          mutators={{
            ...arrayMutators,
          }}
          render={({
            handleSubmit,
            form: {
              mutators: { push, pop },
            }, // injected from final-form-arrays above
            pristine,
            form,
            submitting,
            values,
          }) => {
            return (
              <form onSubmit={handleSubmit}>
                <div class="row mx-0" style={{ width: "100%" }}>
                  <div class="assigning_work schedule_worker_main">
                    <div class="row">
                      <div class="col-lg-12 col-md-12 col-sm-12 px-0">
                        <div class="fixed_wraper">
                          <div class="top_btns_wrap row mx-0">
                            <div class="col-lg-12 col-md-12 col-sm-12 px-0 d-flex">
                              <div class="left-sec">
                                <button
                                  class="today"
                                  onClick={() => {
                                    this.resetToTodayDate();
                                  }}
                                >
                                  Today
                                </button>
                                <div class="celander_wrap">
                                  <a
                                    href="Javascript:void(0)"
                                    onClick={() => {
                                      this.changeToPrevWeek();
                                    }}
                                  >
                                    <i class="fa fa-angle-double-left"></i>
                                  </a>
                                </div>

                                <input
                                  type="week2"
                                  id="week"
                                  name="week"
                                  value={
                                    moment(this.state.selectedDays[0]).format(
                                      "DD MMM YYYY"
                                    ) +
                                    " - " +
                                    moment(this.state.selectedDays[6]).format(
                                      "DD MMM YYYY"
                                    )
                                  }
                                  onClick={() => this.handleClick()}
                                  className="form-control SelectedWeekExample"
                                  style={{ marginTop: "5px" }}
                                />
                                <div
                                  id="day-picker"
                                  className="SelectedWeekExample"
                                  style={{ display: "none" }}
                                >
                                  <DayPicker
                                    selectedDays={this.state.selectedDays}
                                    showWeekNumbers
                                    showOutsideDays
                                    modifiers={this.state.modifiers} month={new Date(this.state.selectedDays[0].getFullYear(), this.state.selectedDays[0].getMonth())}
                                    onDayClick={(e) => this.handleDayChange(e)}
                                    onDayMouseEnter={this.handleDayEnter}
                                    onDayMouseLeave={this.handleDayLeave}
                                    onWeekClick={this.handleWeekClick}
                                  />
                                  <i className="fa fa-times close_calendar"></i>
                                </div>
                                <div class="celander_wrap">
                                  <a
                                    href="Javascript:void(0)"
                                    onClick={() => {
                                      this.changeToNextWeek();
                                    }}
                                  >
                                    <i class="fa fa-angle-double-right"></i>
                                  </a>
                                </div>
                                <button class="btn btn-primary">Submit</button>
                              </div>
                              <div class="right-sec">
                                <button
                                  class="btn btn-primary"
                                  onClick={(event) =>
                                    this.onOpenModal(
                                      null,
                                      null,
                                      "cp_default_sch_to_all_users"
                                    )
                                  }
                                >
                                  Copy Default
                                </button>
                                <button
                                  class="btn btn-primary"
                                  onClick={(e) => {
                                    this.copyScheduleToNextWeek(e);
                                  }}
                                >
                                  Copy to Next Week
                                </button>
                              </div>
                            </div>
                          </div>

                          <div class="row mx-0 week_wrap">
                            <div class="col-lg-2 col-md-2 col-sm-12 px-0 mb-3 left-sec-innner flex-wrap d-flex align-items-end">
                              <label>
                                <h5 className="title_wrap">Default</h5>
                              </label>
                            </div>
                            <div class="col-lg-10 col-md-10 col-sm-12 px-0 right-sec-inner">
                              {/*<input type="week" id="week" name="week" onChange={(e)=>  {this.reloadOnWeekChange(e.target.value)}}/>*/}

                              {/*<div class="week_days mt-3">
                                              <ul class="d-flex justify-content-between flex-wrap">
                                                <li>Sunday</li>
                                                <li>Monday</li>
                                                <li>Tuesday</li>
                                                <li>Wednesday</li>
                                                <li>Thrusday</li>
                                                <li>Friday</li>
                                                <li>Saturday</li>
                                                <li>Total Scheduled</li>
                                              </ul>
                                            </div> */}
                            

                              <div class="week_days mt-3">


                                <ul class="d-flex justify-content-between flex-wrap">
                                  {list_days_array.map(
                                    (days_name, days_index) => {
                                      console.log(this.state.selectedDays[days_index])
                                      var ds_slider;

                                      if (days_name !== "All_Days_Total") {
                                        var ds_slider = (
                                        <>
                                          <div className="week_number_wrap">
                                           <p>
                                              {days_array[days_index]}
                                              </p>
                                              <p>
                                              {this.state.selectedDays[days_index].getDate()}
                                              </p>                                       
                                          </div>
                                           <label className="switch">
                                            
                                            <input
                                              type="checkbox"
                                              data-toggle="toggle"
                                              data-size="xs"
                                              onClick={(event) =>
                                                this.onOpenModal(
                                                  null,
                                                  days_name,
                                                  "set_default_schedule"
                                                )
                                              }
                                            />
                                            
                                            <span className="slider round"></span>


                                            </label>
                                        </>
                                        );
                                      }

                                      return this.state.schedule_default
                                        .length > 0 ? (
                                        <li>
                                          {ds_slider}
                                          
                                          {this.state.schedule_default.map(
                                            (sd_fields, sd_index) => {
                                              
                                              if (
                                                days_name == sd_fields.day_name
                                              ) {
                                                if (
                                                  days_name == "All_Days_Total"
                                                ) {
                                                  return (
                                                    <div style={{marginTop:'50px'}}>
                                                      <div>
                                                        <span>
                                                          {
                                                            sd_fields
                                                              .schedule_time_array[
                                                              "0"
                                                            ].total_sch_hours
                                                          }{" "}
                                                          Hours
                                                        </span>
                                                      </div>
                                                    </div>
                                                  );
                                                } else {
                                                  var work_date_date = moment(
                                                    sd_fields.work_date,
                                                    "YYYY/MM/DD"
                                                  );
                                                  if(work_date_date){
                                                    console.log('days_index33 => '+days_index);
                                                    return (
                                                    <div className="data_wraper">
                                                      {/*<div>
                                                        {work_date_date.format(
                                                          "ddd"
                                                        )}
                                                      </div>
                                                      <div>
                                                        {work_date_date.format(
                                                          "D"
                                                        )}
                                                      </div>*/}
                                                      <div className="time_wrap">
                                                        <div>
                                                          {
                                                            sd_fields
                                                              .schedule_time_array[
                                                              "0"
                                                            ].start_time_12Hrs
                                                          }
                                                        </div>
                                                        <div>To</div>
                                                        <div>
                                                          {
                                                            sd_fields
                                                              .schedule_time_array[
                                                              "0"
                                                            ].end_time_12Hrs
                                                          }
                                                        </div>
                                                        <div>
                                                          {
                                                            sd_fields
                                                              .schedule_time_array[
                                                              "0"
                                                            ].total_sch_hours
                                                          }{" "}
                                                          Hours
                                                        </div>
                                                      </div>
                                                      <label className="switch">
                                                        <input
                                                          type="checkbox"
                                                          checked
                                                          data-toggle="toggle"
                                                          data-size="xs"
                                                          onClick={(event) =>
                                                            this.onOpenModal(
                                                              null,
                                                              days_name,
                                                              "disabled_default_schedule",
                                                              sd_fields._id
                                                            )
                                                          }
                                                        />
                                                        <span className="slider round"></span>
                                                      </label>
                                                      <a
                                                        className="edit"
                                                        href="javascript:void(0)"
                                                        onClick={(event) =>
                                                          this.onOpenModal(
                                                            null,
                                                            days_name,
                                                            "edit_default_schedule",
                                                            sd_fields._id
                                                          )
                                                        }
                                                      >
                                                        Edit
                                                      </a>
                                                    </div>
                                                  );
                                                  }
                                                  
                                                }
                                              }
                                            }
                                          )}
                                          
                                        </li>
                                      ) : (
                                        <li> {ds_slider} </li>
                                      );
                                    }
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="box_inner_wrap">
                          {/*Dyanamic part started from here */}

                          {this.state.user_listing_data &&
                            this.state.user_listing_data.map(
                              (records, index) => {
                                var weekly_work_schedule;

                                if (records.schedule_worker_time_weeks["0"]) {
                                  if (
                                    records.schedule_worker_time_weeks["0"]
                                      .work_schedule == "1"
                                  ) {
                                    var weekly_work_schedule = (
                                      <label className="switch">
                                        <input
                                          type="checkbox"
                                          checked
                                          data-toggle="toggle"
                                          data-size="xs"
                                          onClick={(event) =>
                                            this.onOpenModal(
                                              records._id,
                                              null,
                                              "disabled_week"
                                            )
                                          }
                                        />
                                        <span className="slider round"></span>
                                      </label>
                                    );
                                  } else {
                                    alert("else block");
                                    var weekly_work_schedule = (
                                      <label className="switch">
                                        <input
                                          type="checkbox"
                                          data-toggle="toggle"
                                          data-size="xs"
                                          onClick={(event) =>
                                            this.onOpenModal(
                                              records._id,
                                              null,
                                              "enable_week"
                                            )
                                          }
                                        />
                                        <span className="slider round"></span>
                                      </label>
                                    );
                                  }
                                } else {
                                  var weekly_work_schedule = (
                                    <label className="switch">
                                      <input
                                        type="checkbox"
                                        data-toggle="toggle"
                                        data-size="xs"
                                        onClick={(event) =>
                                          this.onOpenModal(
                                            records._id,
                                            null,
                                            "enable_week"
                                          )
                                        }
                                      />
                                      <span className="slider round"></span>
                                    </label>
                                  );
                                }

                                return (
                                  <div class="box-one row mx-0 mt-2">
                                    <div class="col-lg-2 col-md-2 col-sm-12 px-0 left-sec-innner">
                                      <div class="left-box">
                                        <h4>
                                          {records.user_First_Name +
                                            " " +
                                            records.user_Last_Name}
                                        </h4>

                                        {weekly_work_schedule}
                                      </div>
                                    </div>

                                    <div class="col-lg-10 col-md-10 col-sm-12 px-0 right-sec-inner">
                                      <div class="right-box">
                                        <ul class="d-flex justify-content-between flex-wrap">
                                          {list_days_array.map(
                                            (days_name, days_index) => {
                                              var bypass_all_day_total;

                                              if (
                                                days_name !== "All_Days_Total"
                                              ) {
                                                var bypass_all_day_total = (
                                                  <label className="switch">
                                                    <input
                                                      type="checkbox"
                                                      data-toggle="toggle"
                                                      data-size="xs"
                                                      onClick={(event) =>
                                                        this.onOpenModal(
                                                          records._id,
                                                          days_name,
                                                          "add"
                                                        )
                                                      }
                                                    />
                                                    <span className="slider round"></span>
                                                  </label>
                                                );
                                              }

                                              return records
                                                .schedule_worker_timeslist
                                                .length > 0 ? (
                                                <li>
                                                  {bypass_all_day_total}

                                                  {records.schedule_worker_timeslist.map(
                                                    (
                                                      awl_records,
                                                      awl_index
                                                    ) => {
                                                      let add_or_edit_1;
                                                      let total_schedule;

                                                      if (
                                                        days_name ==
                                                        awl_records.day_name
                                                      ) {
                                                        if (
                                                          days_name ==
                                                          "All_Days_Total"
                                                        ) {
                                                          return (
                                                            <div className="employees_data">
                                                              <label>
                                                                Scheduled
                                                              </label>
                                                              <div>
                                                                {
                                                                  awl_records
                                                                    .schedule_time_array[
                                                                    "0"
                                                                  ]
                                                                    .total_sch_hours
                                                                }{" "}
                                                                hours
                                                              </div>

                                                              <label>
                                                                Reported
                                                              </label>
                                                              <div>
                                                                {
                                                                  awl_records
                                                                    .worked_time_array[
                                                                    "0"
                                                                  ]
                                                                    .total_work_hours
                                                                }{" "}
                                                                hours
                                                              </div>

                                                              <div>
                                                                {
                                                                  awl_records
                                                                    .weekly_less_more_hours[
                                                                    "0"
                                                                  ].status_sign
                                                                }{" "}
                                                                {
                                                                  awl_records
                                                                    .weekly_less_more_hours[
                                                                    "0"
                                                                  ].total_hours
                                                                }{" "}
                                                                hours
                                                              </div>
                                                            </div>
                                                          );
                                                        } else {
                                                          return (
                                                            <div className="employees_data">
                                                              <label>
                                                                Scheduled
                                                              </label>
                                                              <div>
                                                                {
                                                                  awl_records
                                                                    .schedule_time_array[
                                                                    "0"
                                                                  ]
                                                                    .start_time_12Hrs
                                                                }{" "}
                                                                to{" "}
                                                                {
                                                                  awl_records
                                                                    .schedule_time_array[
                                                                    "0"
                                                                  ]
                                                                    .end_time_12Hrs
                                                                }{" "}
                                                                {
                                                                  awl_records
                                                                    .schedule_time_array[
                                                                    "0"
                                                                  ]
                                                                    .total_sch_hours
                                                                }{" "}
                                                                hours
                                                              </div>

                                                              <label>
                                                                Reported
                                                              </label>
                                                              <div
                                                                className={
                                                                  awl_records.assignmentStatus
                                                                }
                                                              >
                                                                {
                                                                  awl_records
                                                                    .reported_time_array[
                                                                    "0"
                                                                  ]
                                                                    .start_time_12Hrs
                                                                }{" "}
                                                                to{" "}
                                                                {
                                                                  awl_records
                                                                    .reported_time_array[
                                                                    "0"
                                                                  ]
                                                                    .end_time_12Hrs
                                                                }{" "}
                                                                {
                                                                  awl_records
                                                                    .worked_time_array[
                                                                    "0"
                                                                  ]
                                                                    .total_work_hours
                                                                }{" "}
                                                                hours
                                                              </div>

                                                              <label className="switch">
                                                                <input
                                                                  type="checkbox"
                                                                  checked
                                                                  data-toggle="toggle"
                                                                  data-size="xs"
                                                                  onClick={(
                                                                    event
                                                                  ) =>
                                                                    this.onOpenModal(
                                                                      records._id,
                                                                      days_name,
                                                                      "disabled",
                                                                      awl_records._id
                                                                    )
                                                                  }
                                                                />
                                                                <span className="slider round"></span>
                                                              </label>
                                                              <a
                                                                className="edit"
                                                                href="javascript:void(0)"
                                                                onClick={(
                                                                  event
                                                                ) =>
                                                                  this.onOpenModal(
                                                                    records._id,
                                                                    days_name,
                                                                    "edit",
                                                                    awl_records._id
                                                                  )
                                                                }
                                                              >
                                                                Edit
                                                              </a>
                                                            </div>
                                                          );
                                                        }
                                                      }
                                                    }
                                                  )}
                                                </li>
                                              ) : (
                                                <li>{bypass_all_day_total}</li>
                                              );
                                            }
                                          )}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            )}

                          {/*Dyanamic part end here */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            );
          }}
        />
      </Styles>
    );
  };

  generateStaticForm = () => {
    return (
      <Styles>
        <div> Loading... </div>
      </Styles>
    );
  };

  /*Submit form*/
  onSubmit = async (values) => {
    await sleep(300);

    let send_data = {
      adminId: this.adminId,
      companyId: this.companyId,
      worker_id: this.state.worker_id,
      day_name: this.state.day_name,
      work_week: this.state.work_week,
      work_year: this.state.work_year,
      sch_start_time: this.state.sch_start_time,
      sch_end_time: this.state.sch_end_time,
    };

    this.setState({
      showcheckdetailonclick: true,
      loader: true,
    });

    new ApiManager().scheduleWorkerTime(send_data).then((result) => {
      if (result.no_result) {
        /*this.setState({
                      loader: false,
                  })*/
        return;
      }

      if (result.data) {
        if (result.data.error) {
          /*this.setState({
                          loader: false,
                      })*/
          return;
        }
      }

      this.setState({
        force_refresh_main_view: "1",
        isLoading: false,
        open: false,
        show_this_view: "generateDyanamicForm",
      });
      this.getWorkersAndScheduleListing();
    });
  };

  onSubmitEdit = async (values) => {
    let send_data = {
      current_schedule_id: this.state.current_schedule_id,
      adminId: this.adminId,
      companyId: this.companyId,
      worker_id: this.state.worker_id,
      day_name: this.state.day_name,
      work_week: this.state.work_week,
      work_year: this.state.work_year,
      sch_start_time: this.state.sch_start_time,
      sch_end_time: this.state.sch_end_time,
      rptd_start_time: this.state.rptd_start_time,
      rptd_end_time: this.state.rptd_end_time,
    };

    this.setState({
      showcheckdetailonclick: true,
      loader: true,
    });

    //window.alert(worker_id+'00000000000'+day_name)
    new ApiManager().scheduleWorkerTimeUpdate(send_data).then((result) => {
      if (result.no_result) {
        /*this.setState({
                      loader: false,
                  })*/
        return;
      }
      if (result.data) {
        if (result.data.error) {
          /*this.setState({
                          loader: false,
                      })*/
          return;
        }
      }
      this.setState({
        force_refresh_main_view: "1",
        isLoading: false,
        openEdit: false,
        show_this_view: "generateDyanamicForm",
      });

      this.getWorkersAndScheduleListing();
    });
  };

  onSubmitSchRptdTimeEdit = async (values) => {
    let send_data = {
      current_schedule_logs_id: this.state.current_schedule_logs_id,
      current_schedule_id: this.state.current_schedule_id,
      rptd_ss_start_time: this.state.rptd_ss_start_time,
      rptd_ss_end_time: this.state.rptd_ss_end_time,
      schd_rptd: this.state.schd_rptd,
    };

    this.setState({
      showcheckdetailonclick: true,
      loader: true,
    });

    new ApiManager().scheduleWorkerTimeUpdate(send_data).then((result) => {
      if (result.no_result) {
        return;
      }
      if (result.data) {
        if (result.data.error) {
          return;
        }
      }
      this.setState({
        force_refresh_main_view: "1",
        isLoading: false,
        openRptdTimeEdit: false,
        show_this_view: "generateDyanamicForm",
      });

      this.onOpenModal(
        this.state.worker_id,
        this.state.day_name,
        "edit",
        this.state.current_schedule_id
      );
    });
  };

  onSubmitDefaultSchedule = async (values) => {
    let send_data = {
      adminId: this.adminId,
      companyId: this.companyId,
      day_name: this.state.day_name,
      work_week: this.state.work_week,
      work_year: this.state.work_year,
      def_sch_start_time: this.state.def_sch_start_time,
      def_sch_end_time: this.state.def_sch_end_time,
      current_def_sch_id: this.state.current_def_sch_id,
    };

    this.setState({
      showcheckdetailonclick: true,
      loader: true,
    });

    new ApiManager().scheduleDefault(send_data).then((result) => {
      if (result.no_result) {
        return;
      }
      if (result.data) {
        if (result.data.error) {
          return;
        }
      }
      this.setState({
        force_refresh_main_view: "1",
        isLoading: false,
        open_default_schedule: false,
        show_this_view: "generateDyanamicForm",
      });

      this.getWorkersAndScheduleListing();
    });
  };
}
/*Class over here*/

const grid = 0;

const getItemStyle = (isDragging, draggableStyle) => ({
  userSelect: "none",
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,

  background: isDragging ? "lightgreen" : "grey",

  ...draggableStyle,
});

const getListStyle = (isDraggingOver) => ({
  background: isDraggingOver ? "lightblue" : "lightgrey",
  padding: grid,
  width: "100%",
});

const makeOnDragEndFunction = (fields) => (result) => {
  // dropped outside the list
  if (!result.destination) {
    return;
  }
  fields.move(result.source.index, result.destination.index);
};
let nextId = 1;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mapStateToProps = (state) => {
  const { user, chat } = state;
  return {
    user,
    chat,
  };
};

const actions = {};

export default withRouter(
  connect(mapStateToProps, actions)(Scheduleworkertime)
);
