import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { year, make, model, partName } = await req.json();
  const query = `${make} ${model} ${year} ${partName}`;
  const apiKey = process.env.SERPAPI_API_KEY;

  const url = `https://serpapi.com/search.json?engine=amazon&k=${encodeURIComponent(query)}&amazon_domain=amazon.com&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // The data you provided shows parts are in 'organic_results'
    const rawParts = data.organic_results || [];

    // Map the SerpApi fields to your frontend's expected format
    const formattedParts = rawParts.map((item: any) => ({
      partTerminologyName: item.title,
      brandLabel: item.brand || "Amazon", // Some items might not have a brand field
      partNumber: item.asin || "N/A",
      description: item.title,
      price: item.price?.raw || item.price || "Contact for price",
    }));

    return NextResponse.json(formattedParts);
  } catch (error) {
    console.error("SerpApi Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
