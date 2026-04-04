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

export default function LoginPage() {
  const router = useRouter();
  const { checkAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post("/auth/login", { email, password });
      await checkAuth();
      router.push("/");
    } catch (err: any) {
      if (Array.isArray(err.response?.data?.message)) {
        setError(err.response.data.message.join(", "));
      } else {
        setError(err.response?.data?.message || "Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="_social_login_wrapper _layout_main_wrapper">
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
        <div className="_social_login_wrap">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
                <div className="_social_login_left">
                  <div className="_social_login_left_image">
                    <Image src="/assets/images/login.png" alt="Image" className="_left_img" width={500} height={500} />
                  </div>
                </div>
              </div>
              <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
                <div className="_social_login_content">
                  <div className="_social_login_left_logo _mar_b28">
                    <Image src="/assets/images/logo.svg" alt="Image" className="_left_logo" width={500} height={500} />
                  </div>
                  <p className="_social_login_content_para _mar_b8">Welcome back</p>
                  <h4 className="_social_login_content_title _titl4 _mar_b50">Login to your account</h4>
                  <Button type="button" variant="ghost" className="_social_login_content_btn _mar_b40 !h-auto !p-[12px_60px] !bg-transparent">
                    <Image src="/assets/images/google.svg" alt="Image" className="_google_img" width={20} height={20} /> <span>Or sign-in with google</span>
                  </Button>
                  <div className="_social_login_content_bottom_txt _mar_b40">
                    {" "}
                    <span>Or</span>
                  </div>

                  <form className="_social_login_form" onSubmit={handleLogin}>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="row">
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <Field className="_social_login_form_input _mar_b14">
                          <Label className="_social_login_label _mar_b8">Email</Label>
                          <Input type="email" className="form-control _social_login_input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </Field>
                      </div>
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <Field className="_social_login_form_input _mar_b14">
                          <Label className="_social_login_label _mar_b8">Password</Label>
                          <Input type="password" className="form-control _social_login_input" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </Field>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
                        <div className="form-check _social_login_form_check">
                          <input className="form-check-input _social_login_form_check_input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" defaultChecked />
                          <Label className="form-check-label _social_login_form_check_label" htmlFor="flexRadioDefault2">
                            Remember me
                          </Label>
                        </div>
                      </div>
                      <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
                        <div className="_social_login_form_left">
                          <p className="_social_login_form_left_para">Forgot password?</p>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                        <div className="_social_login_form_btn _mar_t40 _mar_b60">
                          <Button type="submit" className="_social_login_form_btn_link _btn1 !h-auto" disabled={loading}>
                            {loading ? "Logging in..." : "Login now"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                  <div className="row">
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_login_bottom_txt">
                        <p className="_social_login_bottom_txt_para">
                          Dont have an account? <Link href="/register">Create New Account</Link>
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
