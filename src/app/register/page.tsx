"use client";
import React, { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const { checkAuth } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    setError("");
    setLoading(true);

    try {
      await axios.post("/auth/register", { firstName, lastName, email, password });
      await checkAuth();
      router.push("/");
    } catch (err: any) {
      if (Array.isArray(err.response?.data?.message)) {
        setError(err.response.data.message.join(", "));
      } else {
        setError(err.response?.data?.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="_social_registration_wrapper _layout_main_wrapper">
        <div className="_shape_one">
          <Image src="/assets/images/shape1.svg" alt="" className="_shape_img" width={500} height={500} />
          <Image src="/assets/images/dark_shape.svg" alt="" className="_dark_shape" width={500} height={500} />
        </div>
        <div className="_shape_two">
          <Image src="/assets/images/shape2.svg" alt="" className="_shape_img" width={500} height={500} />
          <Image src="/assets/images/dark_shape1.svg" alt="" className="_dark_shape _dark_shape_opacity" width={500} height={500} />
        </div>
        <div className="_shape_three">
          <Image src="/assets/images/shape3.svg" alt="" className="_shape_img" width={500} height={500} />
          <Image src="/assets/images/dark_shape2.svg" alt="" className="_dark_shape _dark_shape_opacity" width={500} height={500} />
        </div>
        <div className="_social_registration_wrap">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
                <div className="_social_registration_right">
                  <div className="_social_registration_right_image">
                    <Image src="/assets/images/registration.png" alt="Image" width={500} height={500} />
                  </div>
                  <div className="_social_registration_right_image_dark">
                    <Image src="/assets/images/registration1.png" alt="Image" width={500} height={500} />
                  </div>
                </div>
              </div>
              <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
                <div className="_social_registration_content">
                  <div className="_social_registration_right_logo _mar_b28">
                    <Image src="/assets/images/logo.svg" alt="Image" className="_right_logo" width={500} height={500} />
                  </div>
                  <p className="_social_registration_content_para _mar_b8">Get Started Now</p>
                  <h4 className="_social_registration_content_title _titl4 _mar_b50">Registration</h4>
                  <Button type="button" variant="ghost" className="_social_registration_content_btn _mar_b40 !h-auto !p-[12px_60px] !bg-transparent">
                    <Image src="/assets/images/google.svg" alt="Image" className="_google_img" width={20} height={20} /> <span>Register with google</span>
                  </Button>
                  <div className="_social_registration_content_bottom_txt _mar_b40">
                    <span>Or</span>
                  </div>

                  <form className="_social_registration_form" onSubmit={handleRegister}>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="row">
                      <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                        <Field className="_social_registration_form_input _mar_b14">
                          <Label className="_social_registration_label _mar_b8">First Name</Label>
                          <Input type="text" className="form-control _social_registration_input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                        </Field>
                      </div>
                      <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                        <Field className="_social_registration_form_input _mar_b14">
                          <Label className="_social_registration_label _mar_b8">Last Name</Label>
                          <Input type="text" className="form-control _social_registration_input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                        </Field>
                      </div>
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <Field className="_social_registration_form_input _mar_b14">
                          <Label className="_social_registration_label _mar_b8">Email</Label>
                          <Input type="email" className="form-control _social_registration_input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </Field>
                      </div>
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <Field className="_social_registration_form_input _mar_b14">
                          <Label className="_social_registration_label _mar_b8">Password</Label>
                          <Input type="password" className="form-control _social_registration_input" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </Field>
                      </div>
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <Field className="_social_registration_form_input _mar_b14">
                          <Label className="_social_registration_label _mar_b8">Repeat Password</Label>
                          <Input type="password" className="form-control _social_registration_input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        </Field>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
                        <div className="form-check _social_registration_form_check">
                          <input className="form-check-input _social_registration_form_check_input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" defaultChecked />
                          <Label className="form-check-label _social_registration_form_check_label" htmlFor="flexRadioDefault2">
                            I agree to terms & conditions
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                        <div className="_social_registration_form_btn _mar_t40 _mar_b60">
                          <Button type="submit" className="_social_registration_form_btn_link _btn1 !h-auto" disabled={loading}>
                            {loading ? "Registering..." : "Register now"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                  <div className="row">
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_bottom_txt">
                        <p className="_social_registration_bottom_txt_para">
                          Already have an account? <Link href="/login">Login</Link>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
