import "./App.css";

import React, { useState, useEffect, useRef } from "react";

import * as d3 from "d3";

import axios from "axios";

import { Spin, Pagination, Select } from "antd";

import moment from "moment";

function App() {
  const svgRef = useRef();

  const width = 900;
  const height = 350;
  const padding = 20;
  const NUMBER_OF_ITEM = 6;

  const [loading, setLoading] = useState(false);
  const [chartdata, setChartdata] = useState();
  const [total, setTotal] = useState(0);
  console.log("chartdata", chartdata);
  const [pageNumber, setPageNumber] = useState(1);
  const [typeFilter, setTypeFilter] = useState("total_cases_text");
  const [dateFilter, setDateFilter] = useState("all");

  // console.log("chartdata", chartdata);
  console.log("test", { pageNumber, typeFilter, dateFilter });

  const getPagination = (page, size) => {
    const limit = size ? +size : 0;
    const offset = page === 1 ? 0 : (page - 1) * limit;

    return { limit, offset };
  };

  useEffect(() => {
    fetchData();
  }, []);

  function getDaysArrayByMonth() {
    var daysInMonth = moment().daysInMonth();
    var arrDays = [
      {
        label: "All",
        value: "all",
      },
    ];

    while (daysInMonth) {
      var current = moment().date(daysInMonth);
      arrDays.push(current);
      daysInMonth--;
    }

    return arrDays.reverse();
  }

  const listDate = getDaysArrayByMonth().map((item) => {
    return {
      label: item?.label !== "All" ? moment(item).format("DD/MM/YYYY") : "All",
      value: item?.value !== "all" ? moment(item).format("DD/MM/YYYY") : "all",
    };
  });

  function renameKeys(obj, newKeys) {
    const entries = Object.keys(obj).map((key) => {
      const newKey = newKeys[key] || key;

      return { [newKey]: obj[key] };
    });

    return Object.assign({}, ...entries);
  }

  const handleLogicData = (page, size, type, date, data) => {
    if (data?.length > 0) {
      const test = data?.slice(1);
      const changeKey = test?.map((item) => {
        const newKeys = {
          "Active Cases_text": "active_cases_text",
          Country_text: "country_text",
          "Last Update": "last_update",
          "New Cases_text": "new_cases_text",
          "New Deaths_text": "new_deaths_text",
          "Total Cases_text": "total_cases_text",
          "Total Deaths_text": "total_deaths_text",
          "Total Recovered_text": "total_recovered_text",
        };

        return renameKeys(item, newKeys);
      });
      const changeValue = changeKey?.map((item) => {
        return {
          ...item,
          // active_cases_text: parseInt(
          //   item?.active_cases_text?.replace(/,/g, "")
          // ),
          // new_cases_text: parseInt(item?.new_cases_text?.replace(/,/g, "")),
          // new_deaths_text: parseInt(item?.new_deaths_text?.replace(/,/g, "")),
          last_update: moment(item?.last_update).isValid()
            ? moment(item?.last_update).format("DD/MM/YYYY")
            : "--",
          total_cases_text: parseInt(item?.total_cases_text?.replace(/,/g, "")),
          total_deaths_text: parseInt(
            item?.total_deaths_text?.replace(/,/g, "")
          ),
          total_recovered_text: parseInt(
            item?.total_recovered_text?.replace(/,/g, "")
          ),
        };
      });
      if (date === "all") {
        const list = changeValue?.map((item) => {
          return item;
        });
        setTotal(list?.length);
        const { offset } = getPagination(page, size);
        const listData = list
          ?.map((item, index) => {
            return {
              name: item?.country_text,
              value: item[type],
              id: index + 1,
            };
          })
          .slice(offset, offset + 6);
        setChartdata(listData);
      } else {
        const list = changeValue?.map((item) => {
          return item;
        });
        const filterDate = list.filter(
          (item) => item.last_update === dateFilter
        );
        setTotal(filterDate?.length);
        const { offset } = getPagination(page, size);
        const listData = filterDate
          ?.map((item, index) => {
            return {
              name: item?.country_text,
              value: item[type],
              id: index + 1,
            };
          })
          .slice(offset, offset + 6);
        setChartdata(listData);
      }
    }
  };

  const fetchData = async (
    page = pageNumber,
    size = NUMBER_OF_ITEM,
    type = typeFilter,
    date = dateFilter
  ) => {
    const list = JSON.parse(localStorage.getItem("data"));
    if (list?.length > 0) {
      handleLogicData(page, size, type, date, list);
    } else {
      const options = {
        method: "GET",
        url: "https://covid-19-tracking.p.rapidapi.com/v1",
        headers: {
          "X-RapidAPI-Key":
            "ba62bc4643msh5fca547996026bdp159685jsnc87fc926e591",
          "X-RapidAPI-Host": "covid-19-tracking.p.rapidapi.com",
        },
      };
      try {
        setLoading(true);
        const { data } = await axios.request(options);
        localStorage.setItem("data", JSON.stringify(data));
        if (data?.length > 0) {
          handleLogicData(page, size, type, date, data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (chartdata?.length > 0) {
      // range [độ dài thanh x/y, khoảng cách giữa các điểm]

      //  3] Setup functions for Scales ------------------//
      //xscales
      const xScale = d3
        .scalePoint()
        .domain(chartdata.map((d) => d.name))
        .range([0 + padding + 50, width - padding]);
      //Yscales
      const yScale = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(chartdata, function (d) {
            return d.value;
          }),
        ])
        .range([height - padding, 0 + padding]);

      //  4] Setup functions to draw Lines ---------------//
      const line = d3
        .line()
        .x((d) => xScale(d.name))
        .y((d) => yScale(d.value))
        .curve(d3.curveMonotoneX);

      //  5] Draw line        ---------------------------//
      d3.select(svgRef.current)
        .select("path")
        .attr("d", (value) => line(chartdata))
        .attr("fill", "none")
        .attr("stroke", "yellow");

      //  6] Setup functions to draw X and Y Axes --------//
      const xAxis = d3.axisBottom(xScale);
      const yAxis = d3.axisLeft(yScale);

      //  7] Draw x and y Axes   -------------------------//
      d3.select("#xaxis").remove();
      d3.select(svgRef.current)
        .append("g")
        .attr("transform", `translate(0,${height - padding})`)
        .attr("id", "xaxis")
        .call(xAxis);

      d3.select("#yaxis").remove();
      d3.select(svgRef.current)
        .append("g")
        .attr("transform", `translate(${padding + 50},0)`)
        .attr("id", "yaxis")
        .call(yAxis);
    }
  }, [chartdata]);

  useEffect(() => {
    if (
      pageNumber !== 1 ||
      typeFilter !== "total_cases_text" ||
      dateFilter !== "all"
    ) {
      fetchData(pageNumber, NUMBER_OF_ITEM, typeFilter, dateFilter);
    }
  }, [pageNumber, typeFilter, dateFilter]);

  const handleChangeSelect = (value) => {
    // console.log("value", value);
    setTypeFilter(value);
    // fetchData(1, 6, value);
  };

  const handleChangeDate = (value) => {
    // console.log("value", value);
    setDateFilter(value);
  };

  return (
    <React.Fragment>
      <div className="App">
        <Spin spinning={loading}>
          <div className="App-header">
            <div className="container">
              <div className="d-flex flex-row justify-content-start align-items-center gap-5">
                <div>
                  <Select
                    defaultValue="total_cases_text"
                    style={{ width: 120 }}
                    onChange={(e) => handleChangeSelect(e)}
                    options={[
                      { value: "total_cases_text", label: "Total cases" },
                      { value: "total_deaths_text", label: "Total deaths" },
                      {
                        value: "total_recovered_text",
                        label: "Total recovered",
                      },
                    ]}
                  />
                </div>
                <div>
                  <Select
                    defaultValue={"All"}
                    style={{ width: 120 }}
                    onChange={(e) => handleChangeDate(e)}
                    options={listDate}
                  />
                </div>
              </div>
            </div>
            <svg
              id="chart"
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              style={{ paddingLeft: 100, paddingRight: 100 }}
            >
              <path d="" fill="none" stroke="white" strokeWidth="5" />
            </svg>
            {!!total && (
              <Pagination
                defaultCurrent={1}
                pageSize={6}
                total={total}
                showSizeChanger={false}
                onChange={(page, pageSize) => {
                  // fetchData(page, pageSize);
                  setPageNumber(page);
                }}
              />
            )}
          </div>
        </Spin>
      </div>
    </React.Fragment>
  );
}

export default App;
