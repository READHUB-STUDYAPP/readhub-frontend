import React, { useState } from 'react'
import "../Pricing/Pricing.css"
import { ReadHubImages } from '../../assets/asset';

const Pricing = () => {

    const [isActive, setIsActive] = useState("first");

  return (
    <>
    <div className="pricing">
        <div className="pricingContent">
            <div className="top">
                <div className="back"><span className='arrow'><img src={ReadHubImages.backIcon} alt="Back" /></span></div>
                <div className="tag mx-auto">
                    <span className="icon"><img src={ReadHubImages.pricingIcon} alt="" /></span>
                    <span className="text">Pricing</span>
                </div>
            </div>


            <div className="texts">
                <span className="heading">Simple Pricing, Intentional Features.</span>
                <span className="subheading">ReadHub is in early beta. Early supporters get access and lock in a better price</span>
            </div>


            <div className="buttonTexts">
                <div className="first">
                    <span onClick={()=>setIsActive("first")}
                    style={{ 
                        backgroundColor: isActive === 'first' ? '#1f2a44' : 'transparent',
                        color: isActive === 'first' ? 'white' : 'black',
                        padding: ".3rem .7rem", borderRadius: "25px", fontSize: ".8rem"
                    }}
                    >Early Access</span>
                </div>
                <div className="second">
                    <span
                    onClick={()=>setIsActive("second")}
                    style={{ 
                        backgroundColor: isActive === 'second' ? '#1f2a44' : 'transparent',
                        color: isActive === 'second' ? 'white' : 'black',
                        padding: ".3rem .7rem", borderRadius: "25px", fontSize: ".8rem"
                    }}
                    >Student Access</span>
                </div>
            </div>


            {isActive === "first" && (
                <div className="bottom">
                <div className="bottomCard">
                    <div className="bottomCardContent">
                        <div className="details">
                            <span><img src={ReadHubImages.pricingStarIcon} alt="" /> Full Readhub access</span>
                            <span><img src={ReadHubImages.pricingStarIcon} alt="" />All core reading & retention features</span>
                            <span><img src={ReadHubImages.pricingStarIcon} alt="" />Lifetime price lock-in</span>
                        </div>
                    <div className="button"><span>Get Early Access</span></div>
                    </div>
                </div>
                <div className="topCard">
                    <div className="topCardContent">
                        <div className="top"><span>Early Access (BETA)</span></div>
                        <div className="middle"><b style={{fontSize: "1.5rem", color: "#ffffff"}}>&#8358;3,000</b><span style={{fontSize: ".8rem", color: "#ffffff"}}>/one-time payment</span></div>
                        <div className="last"><span>Built for who wants knowledge to stick</span></div>
                    </div>
                </div>
            </div>
            )}

            {isActive === "second" && (
                <div className="bottom">
                <div className="bottomCard">
                    <div className="bottomCardContent">
                        <div className="details">
                            <span><img src={ReadHubImages.pricingStarIcon} alt="" /> Full beta access</span>
                            <span><img src={ReadHubImages.pricingStarIcon} alt="" />Student price lock-in</span>
                        </div>
                    <div className="button"><span>Get Student Access</span></div>
                    </div>
                </div>
                <div className="topCard">
                    <div className="topCardContent">
                        <div className="top"><span>Student Access</span></div>
                        <div className="middle"><b style={{fontSize: "1.5rem", color: "#ffffff"}}>&#8358;1,500</b><span style={{fontSize: ".8rem", color: "#ffffff"}}>/one-time payment</span></div>
                        <div className="last"><span>Supporting students who care about learning</span></div>
                    </div>
                </div>
            </div>
            )}
        </div>
    </div>
    </>
  )
}

export default Pricing