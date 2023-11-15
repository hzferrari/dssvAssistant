/**
 * 根据下班时间,计算加班时间预览列表
 * @param {Object} options
 * @param {String} clockIn
 * @param {String} clockOut
 * @param {Boolean} isWeekend 是否周末
 * @param {Boolean} isJiucanMinus30 是否就餐计算减去30min
 * @returns {Array} overtimeList
 * @example clockOut = "17:30"
 */
function calculateOvertimeList({ clockIn, clockOut, isWeekend = false, isJiucanMinus30 = false }) {
	if (!clockIn || !clockOut) {
		return;
	}
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

	if (!isWeekend && isJiucanMinus30) {
		// 就餐计算减去30min
		overtimeList.forEach((item) => {
			item.overtime -= 0.5;
		});
		// 去掉前面2项（0和0.25小时不显示）
		overtimeList.splice(0, 2);
	}

	// console.log("加班时间预览列表: ", overtimeList);

	saveToStorageSync("overtimeList", overtimeList);

	return overtimeList;
}
