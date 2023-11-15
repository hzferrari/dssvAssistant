// 考勤查询页 初始化
function initPage1() {
	// 记录已经initPage1了
	saveToStorageSync("hasInitPage1", "1");

	const trs = document.querySelectorAll("tr");
	const trNewIndex = trs.length - 2; // 倒数第二行是最新打卡记录
	// 最新打卡日期
	const td_date = trs[trNewIndex]?.cells[1].innerText;

	if (!td_date) {
		console.log("err==> 获取日期失败");
		return;
	}
	const today = formatDate(new Date(), "yyyyMMdd");
	if (td_date !== today) {
		console.log("warnning==> 您今天的打卡数据还没出来!");
		clearData();

		// clearData会清除hasInitPage1, 未打卡的情况要重新设置hasInitPage1
		saveToStorageSync("hasInitPage1", "1");
		return;
	}

	// 日期对应的上班打卡时间
	let td_clockIn = trs[trNewIndex].cells[6].innerText;

	if (!td_clockIn || td_clockIn === "NA") {
		console.log("warnning==> 您今天的打卡数据还没出来!");

		// 清除之前本地data. 这样在非考勤页打开时, 就不会显示上次（昨天）时间了
		clearData();
		// clearData会清除hasInitPage1, 未打卡的情况要重新设置hasInitPage1
		saveToStorageSync("hasInitPage1", "1");

		return;
	}

	// 保存到本地
	saveToStorageSync("td_date", td_date);
	saveToStorageSync("td_clockIn", td_clockIn);

	const clockOut = _calculateClockOut(td_clockIn);

	// 默认计算工作日。在popup里改变勾选时再重新计算
	calculateOvertimeList({ td_clockIn, clockOut });
}

/**
 * 计算下班时间和加班时间
 * @param {String} clockIn
 * @example clockIn = "08:30"
 */
function _calculateClockOut(clockIn) {
	let clockOut;
	// 如果clockIn早于7:30, 则下班时间固定为16:15
	// 如果clockIn晚于9:30, 则下班时间固定为18:15
	if (compareTime(clockIn, "07:30") <= 0) {
		clockOut = "16:15";
	} else if (compareTime(clockIn, "09:30") >= 0) {
		clockOut = "18:15";
	} else {
		// 下班时间: 上班时间 + 8小时45分钟
		clockOut = addTime(clockIn, "08:45");
	}

	// console.log("今天正常下班时间: ", clockOut);

	saveToStorageSync("clockOut", clockOut);

	return clockOut;
}
