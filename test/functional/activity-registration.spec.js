"use strict";

const { before, after, test, trait } = use("Test/Suite")(
  "activity registration"
);
const Activity = use("App/Models/Activity");
const User = use("App/Models/User");
const ActivityRegistration = use("App/Models/ActivityRegistration");

// Seeder from admin => if  failing, try to change the field + its values
const validQuestionnaire = {
  "dropdown-1414155": "value3v",
  "text-15529591": "aku adalah kucing",
  "number-4914110595": 30,
  "radio-45119": "Ya",
  "scale-15195911": 1,
  "checkbox-123554": "ddkdk",
};

trait("DatabaseTransactions");
trait("Test/ApiClient");
trait("Auth/Client");

before(async () => {
  await User.create({
    email: "123@example.net",
    password: "Example",
    name: "Example Name",
    is_subscribing: 1,
    role_id: 4,
  });
});

after(async () => {
  await User.query().where("email", "123@example.net").delete();
});

trait((suite) => {
  suite.Context.macro("getUser", async function () {
    return await User.findByOrFail("email", "123@example.net");
  });
});

trait((suite) => {
  suite.Context.macro("getUserWithRole", async function (id) {
    return await User.query().where("role_id", id).first();
  });
});

/** Check authorized form fetch with form length > 0 */
test("authorized fetch form test, form length > 0", async ({
  getUserWithRole,
  assert,
  client,
}) => {
  // delete all registrations
  await ActivityRegistration.query().delete();

  // Should use trait
  const user = await getUserWithRole(1);

  const activity = await Activity.query()
    .where("minimum_role_id", user.role_id)
    .first();

  activity.register_begin_date = new Date();
  var register_end_date = new Date();
  register_end_date.setDate(register_end_date.getDate() + 1);
  activity.register_end_date = register_end_date;
  await activity.save();

  // Taking a subset from our seeding data for validation only
  const form_data = [
    {
      type: "text",
      label: "Text Area",
      name: "text-15529591",
      placeholder: true,
      required: true,
    },
  ];

  activity.form_data = JSON.stringify(form_data);
  await activity.save();

  const response = await client
    .get(`v1/activity/${activity.slug}/register`)
    .loginVia(user)
    .end();

  response.assertStatus(200);
  response.assertJSONSubset({
    status: "SUCCESS",
    message: "Form berhasil dimuat.",
    data: form_data,
  });
});

/** Check authorized form fetch with form length == 0 */
test("authorized fetch form test, form length == 0", async ({
  getUserWithRole,
  assert,
  client,
}) => {
  await ActivityRegistration.query().delete();

  // Should use trait
  const user = await getUserWithRole(1);

  const activity = await Activity.query()
    .where("minimum_role_id", user.role_id)
    .first();

  activity.register_begin_date = new Date();
  var register_end_date = new Date();
  register_end_date.setDate(register_end_date.getDate() + 1);
  activity.register_end_date = register_end_date;

  const form_data = [];

  activity.form_data = JSON.stringify(form_data);
  await activity.save();

  const response = await client
    .get(`v1/activity/${activity.slug}/register`)
    .loginVia(user)
    .end();

  response.assertStatus(200);
  response.assertJSONSubset({
    status: "SUCCESS",
    message: "Pendaftaran tanpa kuesioner.",
  });
});

/** Test that we cannot fetch form for unauthorized user */
test("unauthorized fetch form test", async ({
  getUserWithRole,
  assert,
  client,
}) => {
  await ActivityRegistration.query().delete();

  // Should use trait
  const user = await getUserWithRole(4);

  const activity = await Activity.query()
    .where("minimum_role_id", ">", 4)
    .first();

  activity.register_begin_date = new Date();
  var register_end_date = new Date();
  register_end_date.setDate(register_end_date.getDate() + 1);
  activity.register_end_date = register_end_date;
  await activity.save();

  const response = await client
    .get(`v1/activity/${activity.slug}/register`)
    .loginVia(user)
    .end();

  response.assertStatus(403);
  response.assertJSONSubset({
    status: "FAILED",
    message: "Jenjangmu belum cukup untuk bisa mengikuti kegiatan ini.",
  });
});

/** Test that authorized user can register
    TODO : valid vs non-valid questionnaire
*/
test("authorized, unregistered user registration should succeed", async ({
  getUser,
  assert,
  client,
}) => {
  await ActivityRegistration.query().delete();
});

/** Test that unauthorized user cannot register */
test("unauthorized user registration should fail", async ({
  getUserWithRole,
  assert,
  client,
}) => {
  await ActivityRegistration.query().delete();
  const user = await getUserWithRole(4);

  const activity = await Activity.query()
    .where("minimum_role_id", ">", user.role_id)
    .first();

  activity.register_begin_date = new Date();
  var register_end_date = new Date();
  register_end_date.setDate(register_end_date.getDate() + 1);
  activity.register_end_date = register_end_date;
  await activity.save();

  const response = await client
    .post(`v1/activity/${activity.slug}/register/submit`)
    .loginVia(user)
    .end();

  // Should be 403 unauthorized
  response.assertStatus(403);
  response.assertJSONSubset({
    status: "FAILED",
    message: "Jenjangmu belum cukup untuk bisa mengikuti kegiatan ini.",
  });
});

/** Test that user cannot re-register */
test("authorized, registered user registration should fail", async ({
  getUser,
  assert,
  client,
}) => {});

/** Test that authorized user with incomplete data cannot register */
test("authorized user with incomplete data should fail", async ({
  getUser,
  assert,
  client,
}) => {
  await ActivityRegistration.query().delete();

  const user = await getUser();

  const activity = await Activity.query().first();

  activity.register_begin_date = new Date();
  var register_end_date = new Date();
  register_end_date.setDate(register_end_date.getDate() + 1);
  activity.register_end_date = register_end_date;
  activity.minimum_role_id = user.role_id;
  await activity.save();

  const response = await client
    .post(`v1/activity/${activity.slug}/register/submit`)
    .loginVia(user)
    .end();

  response.assertStatus(422);
  response.assertJSONSubset({
    status: "FAILED",
    message: "Kamu belum melengkapi data pengguna.",
  });
});

/** Test that we cannot register with invalid questionnaire */
test("registration with invalid questionnaire should fail", async ({
  getUserWithRole,
  assert,
  client,
}) => {
  await ActivityRegistration.query().delete();
  const user = await getUserWithRole(1);

  const activity = await Activity.query()
    .where("minimum_role_id", user.role_id)
    .first();

  activity.register_begin_date = new Date();
  var register_end_date = new Date();
  register_end_date.setDate(register_end_date.getDate() + 1);
  activity.register_end_date = register_end_date;
  await activity.save();

  const response = await client
    .post(`v1/activity/${activity.slug}/register/submit`)
    .send({ "dkdjdjkd": "dmdkjqkjqdkj" })
    .loginVia(user)
    .end();
  response.assertStatus(400);
});

/** Test that we can register with valid questionnaire */
/** Note : somehow this test time outs, probably due to transaction */
test("registration with valid questionnaire should be success", async ({
  getUserWithRole,
  client,
}) => {
  await ActivityRegistration.query().delete();

  // Random user
  const user = await getUserWithRole(1);

  const activity = await Activity.query()
    .where("minimum_role_id", user.role_id)
    .first();

  activity.register_begin_date = new Date();
  var register_end_date = new Date();
  register_end_date.setDate(register_end_date.getDate() + 1);
  activity.register_end_date = register_end_date;
  await activity.save();

  var valid_questionnaire = {
    "dropdown-1414155": "value3v",
    "text-15529591": "aku adalah kucing",
    "number-4914110595": 30,
    "radio-45119": "Ya",
    "scale-15195911": 1,
    "checkbox-123554": ["a", "b", "c"],
    "djjdkadk": "jqkqkdjqkd",
  };

  const response = await client
    .post(`v1/activity/${activity.slug}/register/submit`)
    .send(valid_questionnaire)
    .loginVia(user)
    .end();
  response.assertStatus(200);
});
