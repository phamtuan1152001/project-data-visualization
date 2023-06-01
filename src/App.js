import "./App.css";

import React, { useState, useEffect, useRef } from "react";

import * as d3 from "d3";

import axios from "axios";

import { Spin, Pagination, Select, Calendar, theme, Empty } from "antd";

import moment from "moment";

function App() {
  const svgRef = useRef();

  const { token } = theme.useToken();
  const wrapperStyle = {
    width: 450,
    // margin: 50,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
  };

  const width = 900;
  const height = 350;
  const padding = 20;
  const NUMBER_OF_ITEM = 6;

  const [loading, setLoading] = useState(false);
  const [chartdata, setChartdata] = useState();
  const [total, setTotal] = useState(0);
  const [firstItem, setFirstItem] = useState({});

  const [pageNumber, setPageNumber] = useState(1);
  const [typeFilter, setTypeFilter] = useState("total_cases_text");
  const [dateFilter, setDateFilter] = useState(moment().format("DD/MM/YYYY"));

  // console.log("chartdata", chartdata);
  // console.log("test", { pageNumber, typeFilter, dateFilter });

  const getPagination = (page, size) => {
    const limit = size ? +size : 0;
    const offset = page === 1 ? 0 : (page - 1) * limit;

    return { limit, offset };
  };

  useEffect(() => {
    fetchData();
  }, []);

  function renameKeys(obj, newKeys) {
    const entries = Object.keys(obj).map((key) => {
      const newKey = newKeys[key] || key;

      return { [newKey]: obj[key] };
    });

    return Object.assign({}, ...entries);
  }

  const renderText = (type) => {
    switch (type) {
      case "total_deaths_text":
        return "Total number of deaths with covid 19";
      case "total_recovered_text":
        return "Total number of recovered cases with covid 19";
      default:
        return "Total number of positive cases of covid 19";
    }
  };

  const handleLogicData = (page, size, type, date, data) => {
    if (data?.length > 0) {
      // setFirstItem(data[0]);
      // const test = data?.slice(1);
      const changeKey = data?.map((item) => {
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
      setFirstItem(changeKey[0]);
      const test = changeKey?.slice(1);
      const changeValue = test?.map((item) => {
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
      const list = changeValue?.map((item) => {
        return item;
      });
      const filterDate = list.filter((item) => item.last_update === dateFilter);
      setTotal(filterDate?.length);
      if (filterDate?.length > 0) {
        // console.log("filterDate", filterDate);
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
      } else {
        setChartdata([]);
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

  const handleOnChange = (value) => {
    const date_time = moment(value).format("DD/MM/YYYY");
    // console.log("value", moment(value).format("DD/MM/YYYY"));
    setDateFilter(date_time);
  };

  return (
    <React.Fragment>
      <div className="content-wrapper">
        <div className="d-flex flex-column justify-content-center align-items-cennter h-100">
          <div className="row">
            <div className="col-9">
              <div className="total-data mb-5">
                <h1 className="title-chart mb-3">Total data in World</h1>
                <div className="d-flex flex-row justify-content-around align-items-center">
                  <div className="total-data-box-cases">
                    <h3 className="cases-title">Total cases</h3>
                    <p className="cases-des">{firstItem.total_cases_text}</p>
                  </div>
                  <div className="total-data-box-death">
                    <h3 className="death-title">Total death</h3>
                    <p className="death-des">{firstItem.total_deaths_text}</p>
                  </div>
                  <div className="total-data-box-recovered">
                    <h3 className="recovered-title">Total recovered</h3>
                    <p className="recovered-des">
                      {firstItem.total_recovered_text}
                    </p>
                  </div>
                </div>
              </div>
              <div className="chart-content">
                <div className="d-flex flex-row justify-content-end align-items-center">
                  <Select
                    defaultValue="total_cases_text"
                    style={{ width: 150 }}
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
                <div className="chart-box">
                  <h1 className="title-chart">{renderText(typeFilter)}</h1>
                  {chartdata?.length > 0 ? (
                    <svg
                      id="chart"
                      ref={svgRef}
                      viewBox={`0 0 ${width} ${height}`}
                      // style={{ paddingLeft: 100, paddingRight: 0 }}
                    >
                      <path d="" fill="none" stroke="white" strokeWidth="5" />
                    </svg>
                  ) : (
                    <div className="d-flex flex-column justify-content-center align-items-center h-100">
                      <Empty />
                    </div>
                  )}
                  <div className="d-flex flex-row justify-content-center align-items-center mt-5">
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
                </div>
              </div>
            </div>
            <div className="col-3">
              <div className="d-flex flex-column justify-content-center align-items-center h-100">
                <div className="filter-date-content">
                  <div style={wrapperStyle}>
                    <Calendar
                      fullscreen={false}
                      onChange={(value) => handleOnChange(value.format())}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default App;
