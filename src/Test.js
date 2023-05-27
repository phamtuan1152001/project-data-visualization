// const fetchData = async (page = 1, size = 6) => {
//   try {
//     setLoading(true);
//     const { data } = await axios.get(
//       "https://api.apify.com/v2/key-value-stores/tVaYRsPHLjNdNBu7S/records/LATEST?disableRedirect=true"
//     );
//     if (data?.length > 0) {
//       const { offset } = getPagination(page, size);
//       const list = data?.filter((item) => !!item?.infected);
//       console.log("list", list);
//       setTotal(list?.length);
//       const listData = list
//         ?.map((item, index) => {
//           return {
//             name: item?.country,
//             value: item?.infected,
//             id: index + 1,
//           };
//         })
//         .slice(offset, offset + 6);
//       setChartdata(listData);
//     }
//   } catch (err) {
//     console.log("FETCH FAIL!", err);
//   } finally {
//     setLoading(false);
//   }
// };
