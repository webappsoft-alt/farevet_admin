// AnimatedCircularBar.js
import React, { useState, useEffect } from "react";
import { Animate } from "react-move";

const AnimatedCircularBar = (props) => {
    const [isAnimated, setIsAnimated] = useState(false);

    useEffect(() => {
        let interval;

        if (props.repeat) {
            interval = window.setInterval(() => {
                setIsAnimated((prevIsAnimated) => !prevIsAnimated);
            }, props.duration * 1000);
        } else {
            setIsAnimated(true);
        }

        return () => {
            window.clearInterval(interval);
        };
    }, [props.repeat, props.duration]);

    return (
        <Animate
            start={() => ({
                value: props.valueStart
            })}
            update={() => ({
                value: [
                    isAnimated ? props.valueEnd : props.valueStart
                ],
                timing: {
                    duration: props.duration * 1000,
                    ease: props.easingFunction
                }
            })}
        >
            {({ value }) => props.children(value)}
        </Animate>
    );
};

export default AnimatedCircularBar;
