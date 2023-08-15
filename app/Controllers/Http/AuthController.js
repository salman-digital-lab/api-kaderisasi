"use strict";
const Helpers = use("Helpers");
const User = use("App/Models/User");
const Hash = use("Hash");
const Database = use("Database");
const Mail = use("Mail");
const { unlink } = use("fs").promises;

const { validateAll } = use("Validator");
const District = use("App/Models/District");
const Province = use("App/Models/Province");
const Regency = use("App/Models/Regency");
const University = use("App/Models/University");
const Village = use("App/Models/Village");
const ActivityRegistration = use("App/Models/ActivityRegistration");
const StudentCare = use("App/Models/StudentCare");
const Env = use("Env");

class AuthController {
  async register({ request, response }) {
    const rules = {
      email: "required|email|unique:members,email",
      password: "required",
      name: "required",
      is_subscribing: "required|integer",
    };
    const body = request.all();
    const validation = await validateAll(body, rules);
    if (validation.fails()) {
      const failedUniqueEmail = validation
        .messages()
        .reduce((isEmailExists, message) => {
          return (
            isEmailExists ||
            (message.field === "email" && message.validation === "unique")
          );
        }, false);
      if (failedUniqueEmail) {
        return response.status(409).json({
          status: "FAILED",
          message:
            "Gagal mendaftar karena email sudah pernah terdaftar sebelumnya",
        });
      } else {
        const messages = validation.messages().map((message) => {
          return message.message;
        });
        return response.status(400).json({
          status: "FAILED",
          message: messages,
        });
      }
    } else {
      const newUser = new User();
      newUser.email = body.email;
      newUser.password = body.password;
      newUser.name = body.name;
      newUser.is_subscribing = body.is_subscribing;
      newUser.role_id = 4; // JAMAAH

      try {
        await newUser.save();
        return response.status(200).json({
          status: "SUCCESS",
          data_profile: newUser,
          message: "User has succesfully registered",
        });
      } catch (err) {
        return response.status(400).json({
          status: "FAILED",
          message: err.message,
        });
      }
    }
  }

  async update({ request, auth, response }) {
    const rules = {
      name: "required_if:name|string",
      gender: "required|string|in:M,F",
      phone: "required|string",
      line_id: "required|string",
      date_of_birthday: "required|date",
      city_of_birth: "required|string",
      province_id: "required|string",
      regency_id: "required|string",
      district_id: "required|string",
      village_id: "required|string",
      from_address: "required|string",
      current_address: "required|string",
      university_id: "required|integer",
      intake_year: "required|integer",
      faculty: "required|string",
      major: "required|string",
      student_id: "required|string",
      is_subscribing: "required_if:is_subscribing|integer",
    };

    const body = request.all();
    const validation = await validateAll(body, rules);

    if (validation.fails()) {
      return response.status(400).json({
        status: "FAILED",
        message: validation.messages(),
      });
    }

    try {
      const user = await User.findOrFail(auth.user.id);
      user.name = body.name;
      user.gender = body.gender;
      user.phone = body.phone;
      user.line_id = body.line_id;
      user.date_of_birthday = body.date_of_birthday;
      user.city_of_birth = body.city_of_birth;
      user.province_id = body.province_id;
      user.regency_id = body.regency_id;
      user.district_id = body.district_id;
      user.village_id = body.village_id;
      user.from_address = body.from_address;
      user.current_address = body.current_address;
      user.university_id = body.university_id;
      user.intake_year = body.intake_year;
      user.faculty = body.faculty;
      user.major = body.major;
      user.student_id = body.student_id;
      user.is_subscribing = body.is_subscribing;
      await user.save();

      return response.status(200).json({
        status: "SUCCESS",
        data: user,
        message: "User data updated",
      });
    } catch (err) {
      return response.status(500).json({
        status: "FAILED",
        message: err.message,
      });
    }
  }

  async login({ request, auth, response }) {
    const rules = {
      email: "required",
      password: "required",
    };
    const { email, password } = request.all();
    const body = {
      email: email,
      password: password,
    };
    const validation = await validateAll(body, rules);
    if (validation.fails()) {
      return response.status(401).json({
        status: "FAILED",
        message: validation.messages()[0].message,
      });
    }

    const user = await User.findBy("email", email);
    if (!user) {
      return response.status(401).json({
        status: "FAILED",
        message: "Email is not registered",
      });
    }

    if (user.verifyPassword(password)) {
      const token = await auth.generate(user);
      return response.status(200).json({
        status: "SUCCESS",
        data: user,
        token: token.token,
        message: "User has logged in successfully",
      });
    }

    return response.status(401).json({
      status: "FAILED",
      message: "Invalid password",
    });
  }

  async activities({ auth, request, response }) {
    try {
      const params = request.get();
      const page = params.page || 1;
      const page_size = params.perPage || 20;
      const status = params.status || "";
      const name = params.name || "";

      const banner_base_url = Env.get("CAROUSEL_URL");

      let activities = await ActivityRegistration.query()
        .select([
          "activities.name",
          "activities.slug",
          "activities.begin_date",
          "activities.end_date",
          "activities.register_begin_date",
          "activities.register_end_date",
          "activities.status",
          "activities.category_id",
          "activities.minimum_role_id",
          "activities.created_at",
          "activities.viewer",
          "activity_categories.name AS activity_categories_name",
          "activity_registrations.status AS activity_registrations_status",
          "activity_registrations.created_at AS registered_at",
          "activity_registrations.updated_at AS registered_updated_at",
          "member_roles.id AS minimum_role_id",
          "member_roles.name AS minimum_role_name",
          "member_roles.shortname AS minimum_role_shortname",
          "activity_carousels.id as banner_file_id",
          "activity_carousels.filename as banner_file_banner_file",
        ])
        .from("activity_registrations")
        .leftJoin(
          "activities",
          "activity_registrations.activity_id",
          "activities.id"
        )
        .leftJoin(
          "member_roles",
          "activities.minimum_role_id",
          "member_roles.id"
        )
        .joinRaw(
          "left join activity_carousels ON activity_carousels.id = (SELECT id FROM activity_carousels WHERE activity_carousels.activity_id = activity_registrations.activity_id LIMIT 1)"
        )
        .leftJoin(
          "activity_categories",
          "activities.category_id",
          "activity_categories.id"
        )
        .where(function () {
          this.where(
            "activity_registrations.status",
            "LIKE",
            `%${status}%`
          ).andWhere("activities.name", "LIKE", `%${name}%`);
        })
        .andWhere("member_id", auth.user.id)
        .orderBy("activity_registrations.created_at", "desc")
        .paginate(page, page_size);

      activities = activities.toJSON();

      const meta = {
        total: activities.total,
        perPage: activities.perPage,
        page: activities.page,
        lastPage: activities.lastPage,
      };
      const data = activities.data.map((activity) => {
        return {
          name: activity.name,
          slug: activity.slug,
          begin_date: activity.begin_date,
          end_date: activity.end_date,
          register_begin_date: activity.register_begin_date,
          register_end_date: activity.register_end_date,
          status: activity.status,
          category_id: activity.category_id,
          created_at: activity.created_at,
          viewer: activity.viewer,
          category: {
            name: activity.activity_categories_name,
          },
          activity_registration: {
            status: activity.activity_registrations_status,
            created_at: activity.registered_at,
            updated_at: activity.registered_updated_at,
          },
          minimum_role: {
            id: activity.minimum_role_id,
            name: activity.minimum_role_name,
            shortname: activity.minimum_role_shortname,
          },
          banner_image: {
            id: activity.banner_file_id,
            file: activity.banner_file_banner_file,
          },
        };
      });

      return response.status(200).json({
        status: "SUCCESS",
        message: "Berhasil mendapatkan data aktivitas jamaah",
        data: { banner_base_url, meta, data },
      });
    } catch (err) {
      return response.status(401).json({
        status: "FAILED",
        message: err.message,
      });
    }
  }

  async studentCares({ auth, request, response }) {
    try {
      const params = request.get();
      const page = params.page || 1;
      const page_size = params.perPage || 20;

      let studentCares = await StudentCare.query()
        .select(
          "student_care.id",
          "student_care.member_id",
          "student_care.problem_owner",
          "student_care.problem_owner_name",
          "student_care.problem_category",
          "student_care.problem_category_desk",
          "student_care.technical_handling",
          "student_care.counselor_gender",
          "student_care.id_counselor",
          "student_care.status_handling",
          "users.display_name AS counselor_name",
          "student_care.created_at"
        )
        .leftJoin("users", "student_care.id_counselor", "=", "users.id")
        .where("member_id", auth.user.id)
        .orderBy("created_at", "desc")
        .paginate(page, page_size);

      studentCares = studentCares.toJSON();

      const meta = {
        total: studentCares.total,
        perPage: studentCares.perPage,
        page: studentCares.page,
        lastPage: studentCares.lastPage,
      };
      const data = studentCares.data.map((studentCare) => {
        return {
          id: studentCare.id,
          member_id: studentCare.member_id,
          problem_owner: studentCare.problem_owner,
          problem_owner_name: studentCare.problem_owner_name,
          problem_category: studentCare.problem_category,
          problem_category_desk: studentCare.problem_category_desk,
          technical_handling: studentCare.technical_handling,
          counselor_gender: studentCare.counselor_gender,
          id_counselor: studentCare.id_counselor,
          counselor_name: studentCare.counselor_name,
          status_handling: studentCare.status_handling,
          created_at: studentCare.created_at,
        };
      });

      return response.status(200).json({
        status: "SUCCESS",
        message: "Berhasil mendapatkan data ruang curhat",
        data: { meta, data },
      });
    } catch (err) {
      return response.status(401).json({
        status: "FAILED",
        message: err.message,
      });
    }
  }

  async get({ request, auth, response }) {
    try {
      let user = await User.findByOrFail("id", auth.user.id);
      user = user.toJSON();

      for (const key in user) {
        if (key == "file_image") {
          user[key] = user[key] ? Env.get("PROFILE_URL") + user[key] : "";
        } else {
          user[key] = user[key] ? user[key] : "";
        }
      }

      return response.status(200).json({
        status: "SUCCESS",
        message: "get user success",
        data: user,
      });
    } catch (err) {
      return response.status(401).json({
        status: "FAILED",
        message: err.message,
      });
    }
  }

  async changeProfile({ request, auth, response }) {
    const user = auth.user;
    // this is when validation occurs
    const profilePic = request.file("profile_pic", {
      types: ["image"],
      size: "2mb",
    });

    await profilePic.move(Helpers.publicPath("profile_pic"), {
      name:
        user.id.toString() +
        "-" +
        new Date().getTime() +
        "." +
        profilePic.extname,
      overwrite: false,
    });

    if (!profilePic.moved()) {
      return response.status(403).json({
        status: "FAILED",
        message: profilePic.error().message,
      });
    } else {
      try {
        const user_logged = await User.findBy("id", user.id);

        if (user_logged.file_image) {
          const file = `./public/profile_pic/${user_logged.file_image}`;
          await unlink(file);
        }

        await Database.table("members").where("id", user.id).update({
          file_image: profilePic.fileName,
        });

        return response.status(200).json({
          status: "SUCCESS",
          message: "Profile pict successfully updated",
          data: {
            file_image: Env.get("PROFILE_URL") + profilePic.fileName,
          },
        });
      } catch (err) {
        return response.status(401).json({
          status: "FAILED",
          message: err.message,
        });
      }
    }
  }

  async forgotPassword({ request, response }) {
    const { email } = request.all();
    try {
      const user = await User.findBy("email", email);

      if (!user) {
        return response.status(404).json({
          status: "FAILED",
          message: "Email tidak ditemukan",
        });
      }

      if (Env.get("NODE_ENV") !== "testing") {
        const encrypted = user.AESEncrypt();
        const reset_url =
          Env.get("FORGOT_PASSWORD_LINK") + "token=" + encrypted;
        const logoUrl = Env.get("LOGO_URL") + "logo-salman-black.png";

        await Mail.send(
          "emails/forgot_password",
          { reset_url, logoUrl },
          (message) => {
            message
              .to(user.email)
              .from(Env.get("MAIL_FROM"))
              .subject("Reset Kata sandi akun Portal Aktivis Salman ITB");
          }
        );
      }

      return response.status(200).json({
        status: "SUCCESS",
        message: "Email lupa password terkirim",
      });
    } catch (err) {
      return response.status(500).json({
        status: "FAILED",
        message: err.message,
      });
    }
  }

  async resetPassword({ response, params, request }) {
    try {
      const { encrypt } = params;
      const body = request.all();
      const user = await User.decryptOrFail(encrypt);

      if (
        body.new_password === undefined ||
        body.password_confirmation === undefined
      ) {
        return response.status(400).json({
          status: "FAILED",
          message: "Body request tidak lengkap",
        });
      }

      if (body.new_password !== body.password_confirmation) {
        return response.status(400).json({
          status: "FAILED",
          message: "Konfirmasi password salah",
        });
      }

      user.password = body.new_password;
      await user.save();
      return response.status(200).json({
        status: "SUCCESS",
        message: "Password has succesfully updated",
      });
    } catch (err) {
      return response.status(404).json({
        status: "FAILED",
        message: err.message,
      });
    }
  }

  async changePassword({ request, auth, response }) {
    const user = auth.user;
    const body = request.post();
    const isSame = await user.verifyPassword(body.old_password);

    if (!isSame) {
      return response.status(401).json({
        status: "FAILED",
        message: "Password lama salah",
      });
    }

    try {
      user.password = body.new_password;
      await user.save();
      return response.status(200).json({
        status: "SUCCESS",
        message: "Password berhasil diupdate",
      });
    } catch (err) {
      return response.status(404).json({
        status: "FAILED",
        message: err.message,
      });
    }
  }
}

module.exports = AuthController;
