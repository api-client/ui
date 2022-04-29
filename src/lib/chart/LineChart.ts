import { 
  create, map, range, extent, max, axisBottom, axisLeft, line as d3Line, curveLinear, CurveFactory, 
  scaleUtc, scaleLinear, ScaleTime, ScaleLinear, NumberValue, ValueFn
} from 'd3';

export interface ILineChartInit<T> {
  /**
   * given d in data, returns the (temporal) x-value
   */
  x?: (arg: T) => number;
  /**
   * given d in data, returns the (quantitative) y-value
   */
  y?: (arg: T) => number;
  /**
   * for gaps in data
   */
  defined?: (arg: unknown, i: number) => boolean;
  /**
   * method of interpolation between points
   */
  curve?: CurveFactory;
  /**
   * top margin, in pixels
   */
  marginTop?: number;
  /**
   * right margin, in pixels
   */
  marginRight?: number;
  /**
   * bottom margin, in pixels
   */
  marginBottom?: number;
  /**
   * left margin, in pixels
   */
  marginLeft?: number;
  /**
   * outer width, in pixels
   */
  width?: number;
  /**
   * outer height, in pixels
   */
  height?: number;
  /**
   * the x-scale type
   */
  xType?: ScaleTime<Range, any, any>;
  /**
   * [xmin, xmax]
   */
  xDomain?: Iterable<NumberValue> & (NumberValue | Date);
  /**
   * [left, right]
   */
  xRange?: number[];
  /**
   * the y-scale type
   */
  yType?: ScaleLinear<Range, any, any>;
  /**
   * [ymin, ymax]
   */
  yDomain?: Iterable<NumberValue> & (NumberValue | Date);
  /**
   * [bottom, top]
   */
  yRange?: number[];
  /**
   * a format specifier string for the y-axis
   */
  yFormat?: any;
  /**
   * a label for the y-axis
   */
  yLabel?: string | number | boolean | ValueFn<SVGTextElement, undefined, string | number | boolean | null> | null;
  /**
   * stroke color of line
   */
  color?: string;
  /**
   * stroke line cap of the line
   */
  strokeLinecap?: string;
  /**
   * stroke line join of the line
   */
  strokeLinejoin?: string;
  /**
   * stroke width of line, in pixels
   */
  strokeWidth?: number;
  /**
   * stroke opacity of line
   */
  strokeOpacity?: number;
}

export function LineChart<T>(data: Iterable<T>, init: ILineChartInit<T> = {}): SVGSVGElement | null {
  const {
    x = (): number => 0,
    y = (): number => 0,
    curve = curveLinear,
    marginTop = 20,
    marginRight = 30,
    marginBottom = 30,
    marginLeft = 40,
    width = 640,
    height = 400,
    xType = scaleUtc,
    xRange = [marginLeft, width - marginRight],
    yType = scaleLinear,
    yRange = [height - marginBottom, marginTop],
    yFormat,
    yLabel,
    color = "currentColor",
    strokeLinecap = "round",
    strokeLinejoin = "round",
    strokeWidth = 1.5,
    strokeOpacity = 1,
  } = init;

  // Compute values.
  const X = map(data, x);
  const Y = map(data, y);
  const I = range(X.length);

  let defined: (arg: unknown, i: number) => boolean;
  if (typeof init.defined === 'function') {
    defined = init.defined;
  } else {
    defined = (d, i): boolean => !Number.isNaN(X[i]) && !Number.isNaN(Y[i])
  }
  const D = map(data, defined);

  // Compute default domains.
  let xDomain: Iterable<NumberValue> & (NumberValue | Date);
  if (init.xDomain) {
    xDomain = init.xDomain;
  } else {
    xDomain = (extent(X) as unknown) as Iterable<NumberValue> & (NumberValue | Date);
  }
  let yDomain: Iterable<NumberValue> & (NumberValue | Date);
  if (init.yDomain) {
    yDomain = init.yDomain;
  } else {
    yDomain = ([0, max(Y) as number] as unknown) as Iterable<NumberValue> & (NumberValue | Date);
  }

  // Construct scales and axes.
  const xScale = xType(xDomain, xRange);
  const yScale = yType(yDomain, yRange);
  const xAxis = axisBottom(xScale).ticks(width / 80).tickSizeOuter(0);
  const yAxis = axisLeft(yScale).ticks(height / 40, yFormat);

  // Construct a line generator.
  const line = d3Line()
      // @ts-ignore
      .defined(i => D[i])
      .curve(curve)
      // @ts-ignore
      .x(i => xScale(X[i]))
      // @ts-ignore
      .y(i => yScale(Y[i]));

  const svg = create("svg")
      // .attr("width", width)
      // .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(xAxis);

  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(yAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("x2", width - marginLeft - marginRight)
          .attr("stroke-opacity", 0.1))
      .call(g => g.append("text")
          .attr("x", -marginLeft)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(yLabel || null));

  svg.append("path")
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", strokeWidth)
      .attr("stroke-linecap", strokeLinecap)
      .attr("stroke-linejoin", strokeLinejoin)
      .attr("stroke-opacity", strokeOpacity)
      // @ts-ignore
      .attr("d", line(I));

  return svg.node();
}
