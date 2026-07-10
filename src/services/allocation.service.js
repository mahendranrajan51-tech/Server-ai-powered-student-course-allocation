const Allocation = require("../models/Allocation.js");
const Application = require("../models/Application.js");

const getAllocationCount = async () => {

    return await Allocation.aggregate([

        {
            $match: {
                allocationStatus: "ALLOCATED"
            }
        },

        {
            $lookup: {
                from: "courses",
                localField: "course",
                foreignField: "_id",
                as: "course"
            }
        },

        {
            $unwind: "$course"
        },

        {
            $group: {

                _id: "$course._id",

                courseName: {
                    $first: "$course.courseName"
                },

                courseCode: {
                    $first: "$course.courseCode"
                },

                allocatedStudents: {
                    $sum: 1
                }

            }
        },

        {
            $sort: {
                courseCode: 1
            }
        }

    ]);

};

const getCategorySummary = async () => {

    return await Allocation.aggregate([

        {
            $lookup: {

                from: "users",

                localField: "student",

                foreignField: "_id",

                as: "student"

            }
        },

        {
            $unwind: "$student"
        },

        {
            $group: {

                _id: "$student.category",

                total: {
                    $sum: 1
                },

                allocated: {

                    $sum: {

                        $cond: [

                            {
                                $eq: [
                                    "$allocationStatus",
                                    "ALLOCATED"
                                ]
                            },

                            1,

                            0

                        ]

                    }

                },

                rejected: {

                    $sum: {

                        $cond: [

                            {
                                $eq: [
                                    "$allocationStatus",
                                    "REJECTED"
                                ]
                            },

                            1,

                            0

                        ]

                    }

                }

            }

        }

    ]);

};

const getMissedFirstPreference = async () => {

    return await Allocation.aggregate([

        {
            $match: {

                $or: [

                    {
                        allocationStatus: "REJECTED"
                    },

                    {
                        allocatedPreference: {
                            $gt: 1
                        }
                    }

                ]

            }

        },

        {
            $lookup: {

                from: "users",

                localField: "student",

                foreignField: "_id",

                as: "student"

            }

        },

        {
            $unwind: "$student"
        },

        {
            $lookup: {

                from: "applications",

                localField: "application",

                foreignField: "_id",

                as: "application"

            }

        },

        {
            $unwind: "$application"
        },

        {
            $project: {

                studentId: 1,

                marks: 1,

                allocationStatus: 1,

                allocatedPreference: 1,

                name: "$student.name",

                category: "$student.category",

                preferences: "$application.preferences"

            }

        }

    ]);

};
const getHighestRejection = async () => {

    return await Application.aggregate([

        {
            $project: {

                firstPreference: {

                    $arrayElemAt: [

                        "$preferences.course",

                        0

                    ]

                }

            }

        },

        {
            $lookup: {

                from: "courses",

                localField: "firstPreference",

                foreignField: "_id",

                as: "course"

            }

        },

        {
            $unwind: "$course"
        },

        {
            $lookup: {

                from: "allocations",

                localField: "_id",

                foreignField: "application",

                as: "allocation"

            }

        },

        {
            $unwind: "$allocation"
        },

        {
            $group: {

                _id: "$course.courseCode",

                courseName: {
                    $first: "$course.courseName"
                },

                applicants: {
                    $sum: 1
                },

                rejected: {

                    $sum: {

                        $cond: [

                            {

                                $or: [

                                    {
                                        $eq: [
                                            "$allocation.allocationStatus",
                                            "REJECTED"
                                        ]
                                    },

                                    {
                                        $gt: [
                                            "$allocation.allocatedPreference",
                                            1
                                        ]
                                    }

                                ]

                            },

                            1,

                            0

                        ]

                    }

                }

            }

        },

        {
            $project: {

                courseName: 1,

                applicants: 1,

                rejected: 1,

                rejectionRate: {

                    $multiply: [

                        {

                            $divide: [

                                "$rejected",

                                "$applicants"

                            ]

                        },

                        100

                    ]

                }

            }

        },

        {
            $sort: {

                rejectionRate: -1

            }

        },

        {
            $limit: 1
        }

    ]);

};

module.exports = {
    getAllocationCount,
    getCategorySummary,
    getMissedFirstPreference,
    getHighestRejection
}