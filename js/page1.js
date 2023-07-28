// 考勤查询页 初始化
function initPage1() {
	// 记录已经initPage1了
	saveToStorageSync("hasInitPage1", "1");

	const trs = document.querySelectorAll("tr");
	const trNewIndex = trs.length - 2; // 倒数第二行是最新打卡记录
	// 最新打卡日期
	const td_date = trs[trNewIndex]?.cells[1].innerText;
	// console.log("最新打卡日期: ", td_date);
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

	const clockOut = calculateTime(td_clockIn);
	// 默认计算工作日。在popup里改变勾选时再重新计算
	calculateOvertimeList(clockIn, clockOut);

	//
	// appendToBody();
}

/**
 * 计算下班时间和加班时间
 * @param {String} clockIn
 * @example clockIn = "08:30"
 */
function calculateTime(clockIn) {
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

/**
 * 根据下班时间,计算加班时间预览列表
 * @param {String} clockIn
 * @param {String} clockOut
 * @param {Boolean} isWeekend 是否周末
 * @returns {Array} overtimeList
 * @example clockOut = "17:30"
 */
function calculateOvertimeList(clockIn, clockOut, isWeekend = false) {
	// 15分钟为单位
	let overtimeList = [];
	// 下班时间与对应加班时长
	let overtime = 0.5; // 加班时间以0.5小时起算
	let nextShowTime;

	if (isWeekend) {
		// 计算周末加班时间。从上班时间开始，中午12:30-13:15午休时间不算在内
		if (compareTime(clockIn, "07:30") < 0) {
			// 上班打卡时间从7:30开始计算
			nextShowTime = addTime("07:30", "00:30"); // 加班时间以0.5小时起算
		} else if (compareTime(clockIn, "12:00") > 0 && compareTime(clockIn, "12:30") <= 0) {
			// 上班时间刚好在(12:00, 12:30] 区间，加上30分钟会进入(12:30, 13:15] 区间，因此要再加45分钟
			nextShowTime = addTime(clockIn, "1:15");
		} else if (compareTime(clockIn, "12:30") > 0 && compareTime(clockIn, "13:15") <= 0) {
			// 上班时间刚好在(12:30, 13:15] 区间，则从13:15开始计算
			nextShowTime = addTime("13:15", "00:30");
		} else {
			nextShowTime = addTime(clockIn, "00:30"); // 加班时间以0.5小时起算
		}

		while (compareTime(nextShowTime, "24:00") < 0) {
			if (compareTime(nextShowTime, "12:30") > 0 && compareTime(nextShowTime, "13:15") <= 0) {
				// 如果nextShowTime在(12:30, 13:15] 区间，直接加上45分钟
				nextShowTime = addTime(nextShowTime, "00:45");
			} else {
				overtimeList.push({
					time: nextShowTime,
					overtime: overtime,
				});
				// 每次叠加15分钟
				nextShowTime = addTime(nextShowTime, "00:15");
				overtime += 0.25;
			}
		}
	} else {
		// 计算非周末加班，从下班时间开始计算
		nextShowTime = addTime(clockOut, "00:30"); // 加班时间以0.5小时起算

		while (compareTime(nextShowTime, "24:00") < 0) {
			overtimeList.push({
				time: nextShowTime,
				overtime: overtime,
			});
			// 每次叠加15分钟
			nextShowTime = addTime(nextShowTime, "00:15");
			overtime += 0.25;
		}
	}

	// 加上跨凌晨的时间
	nextShowTime = `00:${nextShowTime.split(":")[1]}`; // 24:xx => 00:xx
	while (compareTime(nextShowTime, "03:00") <= 0) {
		overtimeList.push({
			time: nextShowTime,
			overtime: overtime,
		});
		// 每次叠加15分钟
		nextShowTime = addTime(nextShowTime, "00:15");
		overtime += 0.25;
	}

	// console.log("加班时间预览列表: ", overtimeList);

	saveToStorageSync("overtimeList", overtimeList);

	return overtimeList;
}

// function appendToBody() {
// 	$(".listtable_box").css("width", "70%");

// 	$("body").append(
// 		`
// 			<div style='position:fixed;top:0;right:100px;'>

// 			</div>
// 		`
// 	);
// }
