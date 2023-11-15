/**
 * 清除storage里的临时data数据
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
	removeFromStorageSync("settings_jiucanCountTypeCheckBox");
	removeFromStorageSync("settings_overTimeCotent"); // 设定集中，加班内容是每天要清除的，需要每天勾选才填入
}
