import type { FC, SVGProps } from "react";

interface LogoIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

const LogoIcon: FC<LogoIconProps> = ({ ...props }) => {
  return (
    <svg
      viewBox="0 0 158.75 39.6875"
      version="1.1"
      id="svg1"
      xmlSpace="preserve"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs id="defs1">
        <style id="style1">
          {`.text-segment { 
            font-family: 'Arial Rounded MT Bold', 'Helvetica Rounded', Arial, sans-serif; 
            font-size: 65px; 
            fill: #333333; 
          }
          .theme-color { fill: #a855f7; }
          .theme-stroke { stroke: #a855f7; stroke-width: 7; fill: none; stroke-linecap: round; }
          .pin-shell { fill: #333333; }`}
        </style>
        <symbol id="pin-icon" viewBox="-25 -65 50 65">
          <path
            className="pin-shell"
            d="m 0,0 c -15,-20 -25,-30 -25,-42 a 25,25 0 1 1 50,0 C 25,-30 15,-20 0,0 Z"
            id="path1"
          />
          <circle className="theme-color" cx="0" cy="-42" r="9" id="circle1" />
        </symbol>
      </defs>
      <g id="layer1">
        <g
          id="g13"
          style={{ fill: "#999999", stroke: "#808080", strokeWidth: 0.5 }}
          transform="translate(-22.489582,-13.074177)"
        >
          <text
            xmlSpace="preserve"
            style={{
              fontFamily: "'Comic Sans MS'",
              fontSize: "28.2222px",
              fill: "#999999",
              stroke: "#808080",
              strokeWidth: 0.5,
            }}
            x="25.826086"
            y="35.499332"
            id="text5"
          >
            <tspan
              id="tspan5"
              style={{
                fontFamily: "'Comic Sans MS'",
                fontSize: "28.2222px",
                fill: "#999999",
                stroke: "#808080",
                strokeWidth: 0.5,
              }}
              x="25.826086"
              y="35.499332"
            >
              L{" "}
            </tspan>
          </text>
          <text
            xmlSpace="preserve"
            style={{
              fontFamily: "'Comic Sans MS'",
              fontSize: "28.2222px",
              fill: "#999999",
              stroke: "#808080",
              strokeWidth: 0.5,
            }}
            x="133.38164"
            y="36.339611"
            id="text6"
          >
            <tspan
              id="tspan6"
              style={{
                fontFamily: "'Comic Sans MS'",
                fontSize: "28.2222px",
                fill: "#999999",
                stroke: "#808080",
                strokeWidth: 0.5,
              }}
              x="133.38164"
              y="36.339611"
            >
              ute
            </tspan>
          </text>
          <text
            xmlSpace="preserve"
            style={{
              fontFamily: "'Comic Sans MS'",
              fontSize: "28.2222px",
              fill: "#999999",
              stroke: "#808080",
              strokeWidth: 0.5,
            }}
            x="57.759686"
            y="36.422634"
            id="text7"
          >
            <tspan
              id="tspan7"
              style={{
                fontFamily: "'Comic Sans MS'",
                fontSize: "28.2222px",
                fill: "#999999",
                stroke: "#808080",
                strokeWidth: 0.5,
              }}
              x="57.759686"
              y="36.422634"
            >
              cal r
            </tspan>
          </text>
        </g>
        <g id="g38" transform="translate(2.6192414,-15.341271)">
          <path
            className="theme-stroke"
            d="m 1.0070051,45.054219 c 14.2626109,0 15.7323729,6.199849 27.1424629,6.199849 17.115135,0 47.131389,-12.686587 73.517212,0.09189 16.402,7.66709 31.69397,-8.505917 49.52223,-4.672372"
            id="path2-7"
            style={{
              fill: "none",
              stroke: "#e9c6af",
              strokeWidth: 2.95589,
              strokeLinecap: "round",
              strokeOpacity: 1,
            }}
          />
          <path
            className="theme-stroke"
            d="m 0.87593707,45.028556 c 14.26261093,0 15.73237293,6.199848 27.14246293,6.199848 17.115135,0 47.131389,-12.686587 73.51723,0.09189 16.402,7.667089 31.69397,-8.505917 49.52223,-4.672372"
            id="path2"
            style={{ stroke: "#f4e3d7", strokeWidth: 1.90021 }}
          />
          <g id="g15" transform="translate(-32.400085,-34.091968)">
            <g id="g12" style={{ fill: "#999999", stroke: "#808080" }}>
              <ellipse
                style={{ fill: "#999999", stroke: "#808080", strokeWidth: 0.5 }}
                id="path5"
                ry="7.2417746"
                rx="7.0672736"
                cy="66.397476"
                cx="57.148945"
              />
              <path
                style={{ fill: "#999999", stroke: "#808080", strokeWidth: 0.5 }}
                d="m 50.502526,68.836542 c 0,0 4.977898,12.205052 6.666829,12.178757 1.693103,-0.02636 6.612509,-12.160798 6.612509,-12.160798"
                id="path11"
              />
            </g>
            <ellipse
              style={{
                fill: "#d38d5f",
                stroke: "#c87137",
                strokeWidth: 0.463621,
              }}
              id="path15"
              cx="57.10128"
              cy="85.245644"
              rx="2.3170493"
              ry="2.3580279"
            />
            <ellipse
              style={{ fill: "#d38d5f", stroke: "#c87137", strokeWidth: 0.5 }}
              id="path13"
              cx="57.221821"
              cy="66.381195"
              rx="3.8736889"
              ry="3.9838767"
            />
          </g>
        </g>
        <use
          x="0"
          y="0"
          xlinkHref="#g15"
          id="use16"
          transform="translate(78.010425,-16.463886)"
        />
      </g>
    </svg>
  );
};

export default LogoIcon;
