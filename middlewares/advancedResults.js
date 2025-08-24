const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  //   Destructure req.query and store in reqQuery
  const reqQuery = { ...req.query };

  //   Fields to remove from reqQuery
  const removeFields = ["select", "sort", "limit", "page"];

  //   Removing fields from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  let queryStr = JSON.stringify(req.query);

  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  query = model.find(JSON.parse(queryStr));

  //   Select fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  //   Populate
  if (populate) {
    query = query.populate(populate);
  }

  const results = await query;
  if (!results) return next(new ErrorResponse("No posts found!", 404));

  // Pagination controls
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.advancedResults = {
    success: true,
    total,
    nbHits: results.length,
    pagination,
    data: results,
  };

  next();
};

module.exports = advancedResults;
