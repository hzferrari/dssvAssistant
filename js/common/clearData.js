/**
 * 清除storage里的临时data数据
 ** 注意：这个函数是每天都会执行一次以清除昨天的数据的函数，并非【清除数据】按钮调用的函数
 */
function clearData() {
	console.log("clear.");
	removeFromStorageSync("hasInitPage1");
	removeFromStorageSync("currentPathTpye");

	removeFromStorageSync("td_date");
	removeFromStorageSync("td_clockIn");
	removeFromStorageSync("clockOut");
	removeFromStorageSync("overTime");
	removeFromStorageSync("selectData");
	removeFromStorageSync("settings_overTimeCotent"); // 设定集中，加班内容是每天要清除的，需要每天勾选才填入
}
