import "./App.css";

import React, { useState, useEffect, useRef } from "react";

import * as d3 from "d3";

import axios from "axios";

import { Spin, Pagination } from "antd";

function App() {
  const svgRef = useRef();

  const width = 900;
  const height = 350;
  const padding = 20;
  const maxValue = 20; // Maximum data value

  const [loading, setLoading] = useState(false);
  const [chartdata, setChartdata] = useState();
  const [total, setTotal] = useState(0);

  console.log("chartdata", chartdata);

  const getPagination = (page, size) => {
    const limit = size ? +size : 0;
    const offset = page === 1 ? 0 : (page - 1) * limit;

    return { limit, offset };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (page = 1, size = 6) => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "https://api.apify.com/v2/key-value-stores/tVaYRsPHLjNdNBu7S/records/LATEST?disableRedirect=true"
      );
      if (data?.length > 0) {
        const { limit, offset } = getPagination(page, size);
        const list = data?.filter((item) => !!item?.infected);
        setTotal(list?.length);
        const listData = list
          ?.map((item, index) => {
            return {
              name: item?.country,
              value: item?.infected,
              id: index + 1,
            };
          })
          .slice(offset, offset + 6);
        setChartdata(listData);
      }
    } catch (err) {
      console.log("FETCH FAIL!", err);
    } finally {
      setLoading(false);
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

  return (
    <React.Fragment>
      <div className="App">
        <Spin spinning={loading}>
          <header className="App-header">
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
                onChange={(page, pageSize) => {
                  fetchData(page, pageSize);
                }}
              />
            )}
          </header>
        </Spin>
      </div>
    </React.Fragment>
  );
}

export default App;
